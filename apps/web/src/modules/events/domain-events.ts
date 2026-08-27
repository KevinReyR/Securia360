export const domainEventTypes = ["organization.created", "member.invited", "site.created", "classification.changed", "assessment.completed", "risk.changed", "document.expiring", "task.overdue"] as const;
export type DomainEventType = (typeof domainEventTypes)[number];
export type DomainEvent = { id: string; organizationId: string; type: DomainEventType; aggregateType: string; aggregateId: string; idempotencyKey: string; occurredAt: string };
