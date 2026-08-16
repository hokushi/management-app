import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    /** withCurrentUser を通ったルートで必ず入っている。 */
    currentUserId: number;
  }
}
