// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { SortableData } from '@lynx-js/lynx-ui'

// cspell:ignore Adelia Apotek Bantul Cahyani Daerah Esthi kesehatan Klinik konsultasi Kota layanan pasien Penambahan pusat Puskesmas rehabilitasi Rumah ruang Sakit Senopati serta Sihono Sinduadi Sleman Sudirohusodo Susi Trirenggo Umum warga Yani Yogyakarta
export const ITEM_COUNT = 90

export interface OrderItem {
  id: string
  region: string
  title: string
  assignee: string
  trackingCode: string
}

const REGIONS = [
  'Kab. Bantul, Trirenggo',
  'Kab. Sleman, Sinduadi',
  'Kota Yogyakarta',
]

const LOCATIONS = [
  'Rumah Sakit Umum Daerah Penambahan Senopati',
  'Puskesmas Trirenggo dan layanan kesehatan warga',
  'Klinik Sudirohusodo dan pusat rehabilitasi',
  'Apotek Bantul serta ruang konsultasi pasien',
]

const ASSIGNEES = [
  'Adelia Cahyani',
  'Sihono Pilot',
  'Esthi Susi',
  'Indra Yani',
]

export function createPerformanceData(): SortableData<OrderItem>[] {
  return Array.from({ length: ITEM_COUNT }, (_, index) => {
    const position = index + 1
    const id = String(position).padStart(2, '0')

    return {
      dataItem: {
        id,
        region: REGIONS[index % REGIONS.length],
        title: `${LOCATIONS[index % LOCATIONS.length]} #${id}`,
        assignee: ASSIGNEES[index % ASSIGNEES.length],
        trackingCode: `GTL${String(7_020_000_000 + position * 7_319)}`,
      },
      getSortingKey: () => `order-${id}`,
    }
  })
}
