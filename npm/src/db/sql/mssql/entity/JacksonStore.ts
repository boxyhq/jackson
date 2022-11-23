import { Entity, Column } from 'typeorm';

@Entity()
export class JacksonStore {
  @Column({
    primary: true,
    type: 'varchar',
    length: 250,
  })
  key!: string;

  @Column({
    type: 'text',
  })
  value!: string;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  iv?: string;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  tag?: string;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt?: Date;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  modifiedAt?: string;
}
