import { InputHTMLAttributes } from 'react';

interface InputWithLabelProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export const InputWithLabel = (props: InputWithLabelProps) => {
  return (
    <label className='form-control w-full'>
      <div className='label'>
        <span className='label-text'>{props.label}</span>
      </div>
      <input
        type='text'
        className='input input-bordered w-full text-sm bg-gray-100'
        value={props.value}
        readOnly={props.readOnly}
        {...props}
      />
    </label>
  );
};
