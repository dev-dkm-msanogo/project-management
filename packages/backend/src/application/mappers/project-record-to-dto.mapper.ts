import type { ProjectRecord } from '@domain/entities/project-record';
import type { ProjectRole } from '@domain/value-objects/project-role';
import type { ProjectRecordDto } from '@shared/index';

export function toProjectRecordDto(record: ProjectRecord, access: ProjectRole): ProjectRecordDto {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    access,
  };
}
