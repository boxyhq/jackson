import { Entity, Column } from 'typeorm';

@Entity()
export class JacksonStore {
  @Column({
    primary: true,
    type: 'varchar',
    length: 1500,
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
}
