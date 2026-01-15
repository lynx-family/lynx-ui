// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface FormPageProps {
  title: string
  subtitle: string
  genderOptions: RadioOption[]
  initialFormData: FormData
}

export interface RadioOption {
  label: string
  value: string
}

export interface FormData {
  gender: string
  name: string
  email: string
  phone: string
  message: string
}

export const formPageData: FormPageProps = {
  title: 'User Information Form',
  subtitle:
    'Please fill in the following information and we will contact you shortly',
  genderOptions: [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ],
  initialFormData: {
    gender: 'male',
    name: '',
    email: '',
    phone: '',
    message: '',
  },
}
