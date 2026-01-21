import { supabase } from '@/lib/supabase';
import { compressImage } from '@/utils/imageCompressor';
import { cancelEventNotifications } from '@/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useSubscriptionStore } from './subscriptionStore';

// Image with hybrid local + remote paths for cost optimization
export interface EventImage {
  local: string;  // Local file path (fast, free)
  remote: string; // Supabase URL (backup, cross-device sync)
}

export interface SpecialEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO string
  images?: EventImage[]; // Hybrid local + remote image paths
  createdAt: string;
  updatedAt: string;
  user_id?: string;
  status?: 'active' | 'paused' | 'completed';
  paused_at?: string | null;
  completed_at?: string | null;
  total_paused_duration?: number; // milliseconds
  isTimeCapsule?: boolean; // New Flag for Time Capsule
}

// Input type for creating/updating events (accepts both formats)
export interface EventInput extends Omit<SpecialEvent, 'images'> {
  images?: (string | EventImage)[]; // Accept both string URLs and hybrid objects
}

interface EventState {
  events: SpecialEvent[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  fetchEventDetails: (id: string) => Promise<void>;
  addEvent: (event: Omit<EventInput, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  deleteEvent: (id: string) => Promise<void>;
  updateEvent: (id: string, updates: Partial<EventInput>) => Promise<void>;
  togglePauseEvent: (id: string) => Promise<void>;
  completeEvent: (id: string) => Promise<void>;
  getEventById: (id: string) => Promise<SpecialEvent | null>;
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      events: [],
      isLoading: false,
      error: null,

      fetchEvents: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('events')
            .select('id, title, date, created_at, updated_at, user_id, status, paused_at, completed_at, total_paused_duration, is_time_capsule, images, description')
            .order('date', { ascending: true });

          if (error) throw error;
          

          // Map DB snake_case to camelCase
          const mappedEvents = data.map((e: any) => ({
             ...e,
             createdAt: e.created_at,
             updatedAt: e.updated_at,
             // Convert string[] from DB to EventImage[] format
             images: e.images?.map((url: string) => ({ local: url, remote: url })) || [],
             description: e.description || '',
             isTimeCapsule: e.is_time_capsule
          }));

          set({ events: mappedEvents });
        } catch (err: any) {
             console.error('Fetch error:', err);
             set({ error: err.message });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchEventDetails: async (id) => {
         try {
             const { data, error } = await supabase
                .from('events')
                .select('*') // Query full details including description and images
                .eq('id', id)
                .single();
             
             if (error) throw error;

             if (data) {
                 const mapped = {
                     ...data,
                     createdAt: data.created_at,
                     updatedAt: data.updated_at,
                     isTimeCapsule: data.is_time_capsule
                 };
                 
                 
                 set((state) => {
                     const existingIndex = state.events.findIndex(e => e.id === id);
                     if (existingIndex >= 0) {
                        const updatedEvents = [...state.events];
                        updatedEvents[existingIndex] = { ...updatedEvents[existingIndex], ...mapped };
                        return { events: updatedEvents };
                     } else {
                        // Add new event (e.g. from shared link)
                        return { events: [...state.events, mapped] };
                     }
                 });
             }
         } catch (err) {
             console.error("Failed to fetch full event details", err);
         }
      },

      addEvent: async (event) => {
        set({ isLoading: true, error: null });
        try {
            // 1. FREE PLAN LIMIT CHECK
            const isPro = useSubscriptionStore.getState().isPro;
            const hasReviewed = useSubscriptionStore.getState().hasReviewed;
            const limit = isPro ? 9999 : (hasReviewed ? 2 : 1);
            const currentCount = get().events.length;
            
            if (currentCount >= limit) {
                throw new Error(`Limit Reached. ${isPro ? '' : hasReviewed ? 'You can create up to 2 memories. ' : 'You can only create 1 memory. '}Upgrade for unlimited.`);
            }

            const { data: { user } = {} } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // 2. Upload Images to Supabase Storage (Hybrid: keep local + remote)
            let hybridImages: EventImage[] = [];
            if (event.images && event.images.length > 0) {
                const uploadPromises = event.images.map(async (imgInput) => {
                    try {
                        // Handle both string (legacy) and EventImage input
                        const localUri = typeof imgInput === 'string' ? imgInput : imgInput.local;
                        
                        // If already an EventImage with remote, keep it
                        if (typeof imgInput !== 'string' && imgInput.remote) {
                            return imgInput;
                        }
                        
                        // If it's a remote URL (not local file), convert to EventImage
                        if (!localUri.startsWith('file://')) {
                            return { local: localUri, remote: localUri } as EventImage;
                        }

                        // Compress before upload
                        const compressed = await compressImage(localUri);
                        const uploadUri = compressed.uri;

                        const response = await fetch(uploadUri);
                        const arrayBuffer = await response.arrayBuffer();
                        const fileExt = 'jpeg';
                        
                        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                        
                        const { error: uploadError } = await supabase.storage
                            .from('Event Image')
                            .upload(fileName, arrayBuffer, {
                                contentType: `image/${fileExt}`,
                                upsert: false
                            });

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('Event Image')
                            .getPublicUrl(fileName);

                        // Return hybrid object with both paths
                        return { local: localUri, remote: publicUrl } as EventImage;
                    } catch (uploadErr) {
                        console.error('Image upload failed:', uploadErr);
                        return null; 
                    }
                });

                const results = await Promise.all(uploadPromises);
                hybridImages = results.filter((img): img is EventImage => img !== null);
            }

            const newEvent = {
                user_id: user.id,
                title: event.title,
                description: event.description,
                date: event.date,
                images: hybridImages.map(img => img.remote), // Store only remote URLs in DB
                is_time_capsule: event.isTimeCapsule || false,
            };

            // 3. Insert into DB (Handle missing column gracefully)
            const { data, error } = await supabase
                .from('events')
                .insert(newEvent)
                .select()
                .single();

            if (error) {
                // Check if specific "missing column" error
                if (error.code === 'PGRST204') {
                     console.warn("Retrying insert without 'images' column (Schema mismatch). Images saved to Storage but reference lost in DB.");
                     // Retry without images to at least save the event text data
                     const { images, ...fallbackEvent } = newEvent;
                     const { data: fallbackData, error: fallbackError } = await supabase
                        .from('events')
                        .insert(fallbackEvent)
                        .select()
                        .single();
                    
                     if (fallbackError) throw fallbackError;

                     // Use fallback data but attach our hybrid images for the store
                     const mappedFallback = {
                        ...fallbackData,
                        images: hybridImages,
                        createdAt: fallbackData.created_at,
                        updatedAt: fallbackData.updated_at
                     };
                     
                     set((state) => ({
                        events: [...state.events, mappedFallback]
                     }));
                     return mappedFallback.id;
                }
                throw error;
            }

            const mappedEvent = {
                ...data,
                images: hybridImages, // Use hybrid local + remote images
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                isTimeCapsule: data.is_time_capsule
            };

            set((state) => ({
                events: [...state.events, mappedEvent]
            }));

            return mappedEvent.id;

        } catch (err: any) {
            console.error('Add error:', err);
            set({ error: err.message });
            throw err; 
        } finally {
            set({ isLoading: false });
        }
      },

      deleteEvent: async (id) => {
         set({ isLoading: true });
         try {
             // 1. Clean up images from Storage
             const eventToDelete = get().events.find(e => e.id === id);
             
             if (eventToDelete && eventToDelete.images && eventToDelete.images.length > 0) {
                 console.log(`[deleteEvent] Found ${eventToDelete.images.length} images to delete for event ${id}`);
                 
                 // Group images by bucket to handle potential legacy/different buckets
                 const bucketMap: Record<string, string[]> = {};

                 eventToDelete.images.forEach(img => {
                     const remoteUrl = img.remote;
                     if (!remoteUrl) return;

                     // Clean URL of query params or hashes which might interfere with path matching
                     const cleanUrl = remoteUrl.split('?')[0].split('#')[0];

                     // Regex to extract bucket and path from probable Supabase public URL structure
                     // URLs usually contain /public/{bucket}/{path} or .../storage/v1/object/public/{bucket}/{path}
                     const match = cleanUrl.match(/\/public\/([^/]+)\/(.+)$/);
                     
                     if (match && match.length >= 3) {
                         const bucketName = decodeURIComponent(match[1]);
                         const path = decodeURIComponent(match[2]);
                         
                         if (!bucketMap[bucketName]) bucketMap[bucketName] = [];
                         bucketMap[bucketName].push(path);
                     } else {
                         // Fallback: Check known bucket patterns explicitly if regex fails
                         let bucket: string | null = null;
                         let path: string | null = null;

                         if (cleanUrl.includes('/Event%20Image/')) {
                             bucket = 'Event Image';
                             path = decodeURIComponent(cleanUrl.split('/Event%20Image/')[1]);
                         } else if (cleanUrl.includes('/Event Image/')) {
                             bucket = 'Event Image';
                             path = decodeURIComponent(cleanUrl.split('/Event Image/')[1]);
                         } else if (cleanUrl.includes('/event-images/')) {
                             bucket = 'event-images'; // Legacy
                             path = decodeURIComponent(cleanUrl.split('/event-images/')[1]);
                         }

                         if (bucket && path) {
                             if (!bucketMap[bucket]) bucketMap[bucket] = [];
                             bucketMap[bucket].push(path);
                         } else {
                             console.warn(`[deleteEvent] Could not parse bucket/path from URL: ${remoteUrl}`);
                         }
                     }
                 });

                 // Delete from each bucket found
                 const deletePromises = Object.entries(bucketMap).map(async ([bucket, paths]) => {
                     if (paths.length > 0) {
                         console.log(`[deleteEvent] Deleting ${paths.length} files from bucket: '${bucket}'`);
                         const { error: storageError } = await supabase.storage
                            .from(bucket)
                            .remove(paths);
                         
                         if (storageError) {
                             console.warn(`[deleteEvent] Failed to delete from ${bucket}:`, storageError);
                         } else {
                             console.log(`[deleteEvent] Successfully deleted files from ${bucket}`);
                         }
                     }
                 });
                 
                 await Promise.all(deletePromises);
             } else {
                 console.log(`[deleteEvent] No images found to delete for event ${id}`);
             }

              // 2. Cancel Notifications
              await cancelEventNotifications(id);

             const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);
            
             if (error) throw error;

             set((state) => ({
                 events: state.events.filter((e) => e.id !== id),
             }));
         } catch (err: any) {
             console.error('Delete error:', err);
             set({ error: err.message });
         } finally {
             set({ isLoading: false });
         }
      },

      togglePauseEvent: async (id) => {
          set({ isLoading: true });
          try {
              const event = get().events.find(e => e.id === id);
              if (!event) throw new Error("Event not found");

              const now = new Date().toISOString();
              const isPaused = event.status === 'paused';
              const newStatus = isPaused ? 'active' : 'paused';
              
              let updates: any = { status: newStatus };

              if (newStatus === 'paused') {
                  updates.paused_at = now;
              } else {
                  // Resuming
                  if (event.paused_at) {
                      const pausedTime = new Date(event.paused_at).getTime();
                      const currentTime = new Date(now).getTime();
                      const duration = currentTime - pausedTime;
                      
                      updates.total_paused_duration = (event.total_paused_duration || 0) + duration;
                      updates.paused_at = null; 
                  }
              }

              const { data, error } = await supabase
                  .from('events')
                  .update(updates)
                  .eq('id', id)
                  .select()
                  .single();

              if (error) throw error;

               set((state) => ({
                  events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e)
              }));

          } catch (err: any) {
              console.error("Pause/Resume error:", err);
              set({ error: err.message });
          } finally {
              set({ isLoading: false });
          }
      },

      completeEvent: async (id) => {
          set({ isLoading: true });
          try {
              const now = new Date().toISOString();
              const updates: Partial<SpecialEvent> = { 
                  status: 'completed', 
                  completed_at: now,
                  paused_at: null // Clear pause state if any
              };

              const { data, error } = await supabase
                  .from('events')
                  .update(updates)
                  .eq('id', id)
                  .select()
                  .single();
              
              if (error) throw error;

              set((state) => ({
                  events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e)
              }));

          } catch (err: any) {
              console.error("Complete error", err);
              set({ error: err.message });
          } finally {
              set({ isLoading: false });
          }
      },

      updateEvent: async (id, updates) => {
          set({ isLoading: true });
          try {
              const { data: { user } } = await supabase.auth.getUser();

              // Handle Image Uploads (Hybrid: keep local + remote)
              let hybridImages = updates.images;
              
              if (updates.images &&updates.images.length > 0 && user) {
                  const uploadPromises = updates.images.map(async (imgInput) => {
                     try {
                        // Handle both string (legacy) and EventImage input
                        const localUri = typeof imgInput === 'string' ? imgInput : imgInput.local;
                        
                        // If already an EventImage with remote, keep it
                        if (typeof imgInput !== 'string' && imgInput.remote) {
                            return imgInput;
                        }
                        
                        // If it's a remote URL (not local file), convert to EventImage
                        if (!localUri.startsWith('file://')) {
                            return { local: localUri, remote: localUri } as EventImage;
                        }

                        // Compress before upload
                        const compressed = await compressImage(localUri);
                        const uploadUri = compressed.uri;

                     const response = await fetch(uploadUri);
                        const arrayBuffer = await response.arrayBuffer();
                        const fileExt = 'jpeg';
                        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                        const filePath = `${fileName}`;

                        const { error: uploadError } = await supabase.storage
                            .from('Event Image')
                            .upload(filePath, arrayBuffer, { contentType: `image/${fileExt}` });
                        
                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('Event Image')
                            .getPublicUrl(filePath);
                        
                        // Return hybrid object
                        return { local: localUri, remote: publicUrl } as EventImage;
                     } catch (e) {
                         console.error("Upload failed in update:", e);
                         return null;
                     }
                  });
                  const results = await Promise.all(uploadPromises);
                  hybridImages = results.filter((img): img is EventImage => img !== null);
              }

              const finalUpdates: any = {
                  ...updates,
                  images: hybridImages?.map(img => 
                    typeof img === 'string' ? img : img.remote
                  ) // Store only remote URLs in DB
              };

              // Map camelCase to snake_case for DB
              if (updates.isTimeCapsule !== undefined) {
                  finalUpdates.is_time_capsule = updates.isTimeCapsule;
                  delete finalUpdates.isTimeCapsule;
              }

              // Optimistic update - ensure proper typing
              set((state) => {
                  return {
                    events: state.events.map((e) => 
                      e.id === id 
                        ? { ...e, images: hybridImages, ...updates } as SpecialEvent
                        : e
                    )
                  };
              });

              const { data, error } = await supabase
                  .from('events')
                  .update(finalUpdates)
                  .eq('id', id)
                  .select()
                  .single();
              
              if (error) {
                    if (error.code === 'PGRST204') {
                         console.warn("Retrying update without 'images' column.");
                         const { images, ...fallbackUpdates } = finalUpdates;
                         const { error: fallbackError } = await supabase
                            .from('events')
                            .update(fallbackUpdates)
                            .eq('id', id);
                        
                         if (fallbackError) throw fallbackError;
                         // Local state already updated optimistically with images, so we are good.
                         // But we should be careful if we reload, images will be gone from DB.
                         return;
                    }
                  console.warn("Supabase update failed:", error.message);
                  set({ error: error.message }); // Restore? Or just notify.
              } else if (data) {
                 const mapped = {
                     ...data,
                     images: finalUpdates.images || [], // Ensure we keep what we sent
                     createdAt: data.created_at,
                     updatedAt: data.updated_at
                 };
                  set((state) => ({
                    events: state.events.map((e) => e.id === id ? mapped : e)
                  }));
              }

          } catch (err: any) {
              console.error("Update error:", err);
              set({ error: err.message });
          } finally {
              set({ isLoading: false });
          }
      },

      getEventById: async (id) => {
          // Try local first
          const localEvent = get().events.find(e => e.id === id);
          if (localEvent) return localEvent;

          // If not found (e.g. shared link), try RPC call or direct select
          // We utilize the custom function for security bypass if it's a shared link scenario,
          // OR standard select if it's just sync lag.
          // For now, standard select (User's own event).
          // If we really implement "Shared Links", we'd call 'get_shared_event' rpc here.
          
          const { data, error } = await supabase.rpc('get_shared_event', { lookup_id: id });
          
          if (data && data.length > 0) {
              const e = data[0];
              return {
                  ...e,
                  createdAt: e.created_at,
                  updatedAt: e.updated_at,
                  isTimeCapsule: e.is_time_capsule
              };
          }
          return null;
      }
    }),
    {
      name: 'special-day-events',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
