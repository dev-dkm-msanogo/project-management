import { DeliverableRecord, DeliverablesRegister } from '@domain/entities/deliverables-register';
import { isoDate, parseIsoDate } from '@application/mappers/iso-date';
import type { DeliverablesInput } from '@shared/index';

/** Traductions du registre des livrables : domaine ⇄ saisie (la lecture est composée par son service). */

export function deliverablesToInput(register: DeliverablesRegister): DeliverablesInput {
  return {
    records: register.records.map(({ props }) => ({
      wbsCode: props.wbsCode,
      verification: props.verification && { ...props.verification, verifiedOn: isoDate(props.verification.verifiedOn) },
      acceptance: props.acceptance && { ...props.acceptance, decidedOn: isoDate(props.acceptance.decidedOn) },
    })),
  };
}

export function inputToDeliverables(projectId: string, input: DeliverablesInput): DeliverablesRegister {
  return DeliverablesRegister.create({
    projectId,
    records: input.records.map((record) =>
      DeliverableRecord.create({
        wbsCode: record.wbsCode,
        verification: record.verification && {
          ...record.verification,
          verifiedOn: parseIsoDate(record.verification.verifiedOn),
        },
        acceptance: record.acceptance && { ...record.acceptance, decidedOn: parseIsoDate(record.acceptance.decidedOn) },
      }),
    ),
  });
}
