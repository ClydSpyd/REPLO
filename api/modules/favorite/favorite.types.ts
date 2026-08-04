export interface FavoriteInput {
  /** The routine being favorited. */
  routine: string;
}

export interface Favorite extends FavoriteInput {
  _id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
