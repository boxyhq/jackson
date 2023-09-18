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
    type: 'timestamp',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    nullable: false,
  })
  createdAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  modifiedAt?: string;
}
