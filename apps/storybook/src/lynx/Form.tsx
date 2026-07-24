import { root, useInitData } from '@lynx-js/react';
import { FormRoot, FormField, FormSubmitButton } from '@lynx-js/lynx-ui-form';
import { Input } from '@lynx-js/lynx-ui-input';
import { RadioGroupRoot, Radio } from '@lynx-js/lynx-ui-radio-group';
import { Switch } from '@lynx-js/lynx-ui-switch';

interface Args {
  showValidation?: boolean;
}

function App() {
  const args = useInitData() as Args;
  const { showValidation = true } = args;

  return (
    <view style={{ width: '100%', padding: '20px' }}>
      <FormRoot showValidation={showValidation}>
        <FormField label="Username" name="username" required={true}>
          <Input placeholder="Enter username" style={{ height: '40px', borderWidth: '1px', borderColor: '#d1d5db', borderRadius: '6px', paddingLeft: '12px' }} />
        </FormField>

        <FormField label="Email" name="email" required={true} style={{ marginTop: '16px' }}>
          <Input placeholder="Enter email" style={{ height: '40px', borderWidth: '1px', borderColor: '#d1d5db', borderRadius: '6px', paddingLeft: '12px' }} />
        </FormField>

        <FormField label="Role" name="role" style={{ marginTop: '16px' }}>
          <RadioGroupRoot>
            <Radio value="admin"><text style={{ fontSize: '14px' }}>Admin</text></Radio>
            <Radio value="editor"><text style={{ fontSize: '14px' }}>Editor</text></Radio>
            <Radio value="viewer"><text style={{ fontSize: '14px' }}>Viewer</text></Radio>
          </RadioGroupRoot>
        </FormField>

        <FormField label="Notifications" name="notifications" style={{ marginTop: '16px' }}>
          <Switch />
        </FormField>

        <FormSubmitButton style={{ marginTop: '24px', height: '44px', backgroundColor: '#3b82f6', borderRadius: '8px', justifyContent: 'center', alignItems: 'center' }}>
          <text style={{ fontSize: '15px', color: '#fff', fontWeight: 'bold' }}>Submit</text>
        </FormSubmitButton>
      </FormRoot>
    </view>
  );
}

root.render(<App />);
