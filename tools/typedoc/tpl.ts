// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as fs from 'node:fs'

function genProps(data, hasMultipleProps?: boolean, isZh?: boolean) {
  const title = data.title
  const children = data.children
  let comments = ''
  if (isZh && data.comment?.blockTags) {
    comments = data.comment?.blockTags[0]?.content[0].text
  } else {
    comments = data.comment?.summary[0]?.text
  }

  let context = ''

  if (!children) return ''

  context = `
${
    hasMultipleProps
      ? `### ${title.replace(/props$/i, '').trim()} `
      : `## ${title}`
  }
    ${comments ? comments : ''}
  `
  children.map(d => {
    const sourceString = JSON.stringify(d.children, null, 2)
    if (children.length > 1) {
      context += `
### ${d.title}
<UIApiTable source={${sourceString}}/>
      `
    } else {
      context += `
<UIApiTable source={${sourceString}}/>
      `
    }
  })
  return context
}

function genRef(data) {
  const title = data.title
  const children = data.children

  if (!children) return ''

  return children.map(d => {
    const sourceString = JSON.stringify(d.children, null, 2)
    return `
## ${title}
<UIApiTable source={${sourceString}}/>
  `
  }).join('\n')
}

const doGenMdx = (data, isZh?: boolean) => {
  if (!data?.[0]?.flag && !data?.[0]?.children) {
    if (!data) {
      return ''
    }

    const sourceString = JSON.stringify(data, null, 2)
    return `
<UIApiTable source={${sourceString}}/>
    `
  }

  return data
    .map(d => {
      if (d.flag && d.title) {
        const comments = isZh && d.comment?.summary_zh
          ? d.comment?.summary_zh
          : d.comment?.summary?.[0]?.text
        return d.flag === '###'
          ? `
${d.flag} ${d.title}
${comments ?? ''}
${doGenMdx(d.children, isZh)}
      `
          : `${doGenMdx(d.children, isZh)}`
      }
    })
    .join('\n')
}

const doGenTplWithData = async (
  dataPath: string,
  savePath: string,
  multipleProps?: boolean,
  titleOrder: string[] = ['Props', 'Method'],
) => {
  const dataString = fs.readFileSync(dataPath, 'utf-8')
  const data = JSON.parse(dataString)
  const isZh = savePath.includes('zh')

  const sortedData = data.children.sort((a, b) => {
    if (a.title.includes('Ref')) return 1
    if (b.title.includes('Ref')) return -1

    const getOrderIndex = (name: string) => {
      const index = titleOrder.findIndex(item => name.includes(item))
      return index === -1 ? titleOrder.length : index
    }
    return getOrderIndex(a.title) - getOrderIndex(b.title)
  })

  let hasProcessedFirstProps = false
  let content

  if (multipleProps) {
    content = `

import { UIApiTable } from "@lynx/index";
  ${
      sortedData.map(item => {
        if (!titleOrder.includes(item.title.replace(/Props$/, ''))) {
          return
        }
        if (item.title.includes('Props')) {
          return genProps(item, multipleProps, isZh)
        }
        if (item.title.includes('Ref')) {
          return genRef(item)
        }
        return
      }).join('\n')
    }
  `

    fs.writeFileSync(savePath, content)
  } else {
    content = `

import { UIApiTable } from "@lynx/index";

  ${
      sortedData.map(item => {
        if (item.title.includes('Props')) {
          if (!hasProcessedFirstProps) {
            hasProcessedFirstProps = true
            return genProps(item, false, isZh)
          }
          return doGenMdx([item], isZh)
        }
        if (item.title.includes('Ref')) {
          return genRef(item)
        }
        return doGenMdx([item], isZh)
      }).join('\n')
    }
  `

    fs.writeFileSync(savePath, content)
  }
}

export { doGenTplWithData }
