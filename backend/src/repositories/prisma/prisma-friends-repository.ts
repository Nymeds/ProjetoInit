import { prisma } from '../../utils/prismaClient.js';
import type { FriendSummary, FriendsRepository } from '../friends-repository.js';

export class PrismaFriendsRepository implements FriendsRepository {
  async listAcceptedByUser(userId: string): Promise<FriendSummary[]> {
    const friendships = await (prisma as any).friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        addressee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships
      .map((friendship: any) => {
        const isRequester = friendship.requesterId === userId;
        const friend = isRequester ? friendship.addressee : friendship.requester;
        return {
          id: friend.id,
          name: friend.name,
          email: friend.email,
        };
      })
      .filter((friend: FriendSummary) => Boolean(friend?.id && friend?.email));
  }
}
