export interface FriendSummary {
  id: string;
  name: string;
  email: string;
}

export interface FriendsRepository {
  listAcceptedByUser(userId: string): Promise<FriendSummary[]>;
}
