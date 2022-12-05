import React from 'react'
import s from './style.module.css'

interface Props
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {}

const Card = ({ className, ...props }: Props) => {
  return (
    <div {...props} className={[s.card, className].filter(Boolean).join(' ')} />
  )
}

export default Card
