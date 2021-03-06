import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { ProjectRfx } from './projectRfx.entity';
import { Project } from './project.entity';
import { RfxPhase } from './rfxPhase.entity';
import { TimesheetEntry } from './timesheetEntry.entity';

@Entity()
export class Timesheet {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(type => ProjectRfx)
  projectRfx: ProjectRfx;

  @ManyToOne(type => Project)
  project: Project;
  
  @ManyToOne(type => RfxPhase, { nullable: true })
  rfxPhase: RfxPhase;
      
  @Column({ type: 'date', nullable: true })
  startDate: Date;
  
  @Column({ type: 'date', nullable: true })
  endDate: Date;
  
  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'boolean', nullable: true })
  isBillable: boolean;

  @Column({ type: 'timestamp', nullable: true })
  dateCreated: Date;
  
  @Column({ type: 'timestamp', nullable: true })
  dateModified: Date;

  @Column({ type: 'uuid', nullable: true })
  createdUserId: string;

  @Column({ type: 'uuid', nullable: true })
  modifiedUserId: string;
  
  @OneToMany(type => TimesheetEntry, type => type.timesheet)
  timesheetEntries: TimesheetEntry[];
}
