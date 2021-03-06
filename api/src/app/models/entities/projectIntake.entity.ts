import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Client } from './client.entity';
import { ProjectSector } from './projectSector.entity';

@Entity()
export class ProjectIntake {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  projectName: string;

  @ManyToOne(type => Client)
  client: Client;

  @ManyToOne(type => ProjectSector)
  projectSector: ProjectSector;

  @Column({ type: 'text', nullable: true })
  commodityCode: string;

  @Column({ type: 'date', nullable: true })
  estimatedCompletionDate: Date;

  @Column({ type: 'double precision', nullable: true })
  estimatedContractValue: number;

  @Column({ type: 'double precision', nullable: true })
  mouAmount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  status: IntakeStatus;

  @Column({ type: 'uuid', nullable: true })
  projectId: string;

  @Column({ type: 'uuid', nullable: true })
  createdUserId: string;

  @Column({ type: 'uuid', nullable: true })
  approverUserId: string;

  @Column({ type: 'timestamp', nullable: true })
  dateCreated: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateModified: Date;
}

export type IntakeStatus = 'submitted' | 'approved' | 'rejected';
