// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

interface PageHeaderProps {
  detail: string
  title: string
}

function PageHeader({ detail, title }: PageHeaderProps) {
  return (
    <header className='flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between'>
      <div className='flex flex-col gap-2'>
        <p className='m-0 text-sm text-content-muted'>L.U.N.A</p>
        <h1 className='m-0 text-3xl font-normal'>{title}</h1>
      </div>
      <p className='m-0 text-sm text-content-muted'>{detail}</p>
    </header>
  )
}

export { PageHeader }
