import { Message } from 'whatsapp-web.js';
import { Member, MemberPermission } from '../application/dtos/members';

export function hasPermissions(
    member: Member | null,
    permissions: MemberPermission[],
    msg?: Message
): boolean {
    if (process.env.ENVIRONMENT === 'local' && msg?.fromMe) {
        return true;
    }

    return (
        !!member &&
        permissions.every((permission) => member.permissions.includes(permission))
    );
}
