import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Index('_jackson_index_key_store', ['key', 'storeKey'])
@Entity()
export class JacksonIndex {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('_jackson_index_key')
  @Column({
    type: 'varchar',
    length: 250,
  })
  key!: string;

  @Column({
    type: 'varchar',
    length: 250,
  })
  storeKey!: string;
}
