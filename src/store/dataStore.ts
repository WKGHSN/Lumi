'use client';
import { create } from 'zustand';
import {
  services as mockServices,
  masters as mockMasters,
  galleryItems as mockGallery,
} from '@/data/mock';
import type { Service, Master, GalleryItem } from '@/types';

// Прибрано порожні extends та type-аліаси — використовуємо типи напряму з types/index.ts
// Якщо в майбутньому знадобляться додаткові поля — розширюй тут

interface DataStore {
  // ---- Services ----
  services: Service[];
  addService: (data: Omit<Service, 'id'>) => Service;
  updateService: (id: string, updates: Partial<Service>) => void;
  toggleServiceActive: (id: string) => void;
  getActiveServices: () => Service[];
  getServicesByCategory: (categoryId: string) => Service[];

  // ---- Masters ----
  masters: Master[];
  updateMaster: (id: string, updates: Partial<Master>) => void;
  toggleMasterActive: (id: string) => void;
  updateMasterAvatar: (id: string, avatarDataUrl: string) => void;
  getActiveMasters: () => Master[];
  getMasterById: (id: string) => Master | undefined;

  // ---- Gallery ----
  gallery: GalleryItem[];
  addGalleryItem: (data: Omit<GalleryItem, 'id' | 'createdAt'>) => GalleryItem;
  removeGalleryItem: (id: string) => void;
  updateGalleryItem: (id: string, updates: Partial<GalleryItem>) => void;
  reorderGallery: (items: GalleryItem[]) => void;
  getGalleryByCategory: (categoryId: string) => GalleryItem[];
}

export const useDataStore = create<DataStore>((set, get) => ({
  // Ініціалізація з мок-даними
  // TODO: замінити на fetch з API при підключенні бекенду
  services: mockServices.map((s) => ({ ...s })),
  masters: mockMasters.map((m) => ({ ...m, isActive: true })),
  gallery: mockGallery.map((g) => ({ ...g })),

  addService: (data) => {
    const service: Service = {
      ...data,
      id: `svc-${crypto.randomUUID()}`,
    };
    set({ services: [...get().services, service] });
    return service;
  },

  updateService: (id, updates) => {
    set({
      services: get().services.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    });
  },

  toggleServiceActive: (id) => {
    set({
      services: get().services.map((s) =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      ),
    });
  },

  // Тільки активні послуги — для публічних сторінок та форми бронювання
  getActiveServices: () => get().services.filter((s) => s.isActive),

  // Послуги по категорії — для сторінки /services та wizard бронювання
  getServicesByCategory: (categoryId) =>
    get().services.filter((s) => s.categoryId === categoryId && s.isActive),

  // ---- Masters ----
  updateMaster: (id, updates) => {
    set({
      masters: get().masters.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    });
  },

  toggleMasterActive: (id) => {
    set({
      masters: get().masters.map((m) =>
        m.id === id ? { ...m, isActive: !m.isActive } : m
      ),
    });
  },

  updateMasterAvatar: (id, avatarDataUrl) => {
    set({
      masters: get().masters.map((m) =>
        m.id === id ? { ...m, avatar: avatarDataUrl } : m
      ),
    });
  },

  // Тільки активні майстри — для публічних сторінок
  getActiveMasters: () => get().masters.filter((m) => m.isActive),

  getMasterById: (id) => get().masters.find((m) => m.id === id),

  // ---- Gallery ----
  addGalleryItem: (data) => {
    const item: GalleryItem = {
      ...data,
      id: `gal-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    // Нові елементи додаються на початок
    set({ gallery: [item, ...get().gallery] });
    return item;
  },

  removeGalleryItem: (id) => {
    set({ gallery: get().gallery.filter((g) => g.id !== id) });
  },

  updateGalleryItem: (id, updates) => {
    set({
      gallery: get().gallery.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    });
  },

  reorderGallery: (items) => set({ gallery: items }),

  getGalleryByCategory: (categoryId) =>
    get().gallery.filter((g) => g.categoryId === categoryId),
}));