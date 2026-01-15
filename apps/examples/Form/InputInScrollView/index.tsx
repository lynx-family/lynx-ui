// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { FormField, FormRoot, FormSubmitButton } from '@lynx-js/lynx-ui-form'
import {
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
  TextArea,
} from '@lynx-js/lynx-ui-input'
import './index.css'
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

function App() {
  const contentArray: string[] = [
    'https://img.zcool.cn/community/01391356a449af32f875520f980fd7.jpg?imageMogr2/auto-orient/thumbnail/1280x%3e/sharpen/0.5/quality/100/format/webp',
    'https://img.zcool.cn/community/01fb5756a449c432f875520fa869ab.jpg?imageMogr2/auto-orient/thumbnail/1280x%3e/sharpen/0.5/quality/100/format/webp',
    'https://img.zcool.cn/community/01c79f56a449f932f875520f47c5ad.jpg?imageMogr2/auto-orient/thumbnail/1280x%3e/sharpen/0.5/quality/100/format/webp',
    'https://img.zcool.cn/community/010e1256a44bf26ac7256cb0c923a1.jpg?imageMogr2/auto-orient/thumbnail/1280x%3e/sharpen/0.5/quality/100/format/webp',
    'https://img.zcool.cn/community/01105456a44b966ac7256cb0aef0a5.jpg?imageMogr2/auto-orient/thumbnail/1280x%3e/sharpen/0.5/quality/100/format/webp',
    'https://img.zcool.cn/community/01fe8756a44d1432f875520f492fb7.jpg?imageMogr2/auto-orient/thumbnail/1280x%3e/sharpen/0.5/quality/100/format/webp',
    'input',
    'input',
    'input',
    'input',
    'input',
    'textarea',
    'input',
    'https://img.zcool.cn/community/01f64056a44d7732f875520f695473.jpg?imageMogr2/auto-orient/thumbnail/1280x%3e/sharpen/0.5/quality/100/format/webp',
  ]

  return (
    <view>
      <FormRoot>
        <KeyboardAwareRoot as='ScrollView'>
          <view className='container'>
            <KeyboardAwareResponder
              style={{
                width: '100%',
                height: '700rpx',
                backgroundColor: 'red',
              }}
            >
              <ScrollView
                scrollviewId={'scrollview'}
                lazyOptions={{
                  enableLazy: false,
                }}
                style={{
                  width: '100%',
                  height: '700rpx',
                  backgroundColor: 'red',
                }}
                scrollOrientation='vertical'
              >
                {contentArray.map((item: string, index) => {
                  if (item === 'input') {
                    return (
                      <KeyboardAwareTrigger
                        style={{
                          padding: '20px',
                          background: 'pink',
                          marginTop: '50px',
                          width: '300px',
                          borderRadius: '8px',
                        }}
                      >
                        <FormField
                          as='Input'
                          name={`input${index}`}
                          style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'aqua',
                          }}
                          placeholder='请输入'
                        />
                      </KeyboardAwareTrigger>
                    )
                  } else if (item === 'textarea') {
                    return (
                      <KeyboardAwareTrigger
                        style={{
                          padding: '20px',
                          background: 'cyan',
                          width: '300px',
                          borderRadius: '8px',
                          marginTop: '20px',
                          backgroundColor: 'lightblue',
                        }}
                      >
                        <TextArea
                          style={{
                            width: '100%',
                          }}
                          placeholder='textarea'
                        />
                      </KeyboardAwareTrigger>
                    )
                  } else {
                    return (
                      <view
                        key={index}
                        style={{
                          width: '100%',
                          height: '700rpx',
                          borderWidth: '1px',
                          backgroundColor: 'royalblue',
                        }}
                      >
                        <image
                          style={{ width: '100%', height: '100%' }}
                          src={item}
                        />
                      </view>
                    )
                  }
                })}
                <FormSubmitButton
                  onSubmit={values => console.log(values)}
                  style={{
                    width: '100%',
                    height: '100rpx',
                    backgroundColor: 'slateblue',
                  }}
                >
                  <text>提交</text>
                </FormSubmitButton>
              </ScrollView>
            </KeyboardAwareResponder>
          </view>
        </KeyboardAwareRoot>
      </FormRoot>
    </view>
  )
}

root.render(<App />)

export default App
