import React from 'react'
import s from './style.module.css'

interface Props
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}

const Button = ({ className, ...props }: Props) => {
  return (
    <button
      {...props}
      className={[s.button, className].filter(Boolean).join(' ')}
    />
  )
}

export default Button
