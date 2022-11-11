import { Entity, Column, Index } from 'typeorm';

@Entity()
export class JacksonTTL {
  @Column({
    primary: true,
    type: 'varchar',
    length: 1500,
  })
  key!: string;

  @Index('_jackson_ttl_expires_at')
  @Column({
    type: 'bigint',
  })
  expiresAt!: number;
}
