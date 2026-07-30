import { Order, Prisma, PrismaClient, SupportTicket, User, Wallet } from "@prisma/client";

export type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export class UserRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public findByEmail(email: string): Promise<User | null> {
    return this.database.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  public findById(id: string): Promise<User | null> {
    return this.database.user.findUnique({ where: { id } });
  }
}

export class WalletRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public findByUserId(userId: string): Promise<Wallet | null> {
    return this.database.wallet.findUnique({ where: { userId } });
  }

  public findById(id: string): Promise<Wallet | null> {
    return this.database.wallet.findUnique({ where: { id } });
  }
}

export class OrderRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public findOwnedById(id: string, userId: string): Promise<Order | null> {
    return this.database.order.findFirst({
      where: { id, userId },
    });
  }

  public listForUser(
    userId: string,
    options: { cursor?: string; take?: number } = {},
  ): Promise<Order[]> {
    const cursor = options.cursor ? { id: options.cursor } : undefined;

    return this.database.order.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: Math.min(options.take ?? 20, 100),
      ...(cursor ? { cursor, skip: 1 } : {}),
    });
  }
}

export class SupportTicketRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public findOwnedById(id: string, userId: string): Promise<SupportTicket | null> {
    return this.database.supportTicket.findFirst({
      where: { id, userId },
    });
  }
}

export function createRepositories(database: DatabaseClient) {
  return {
    users: new UserRepository(database),
    wallets: new WalletRepository(database),
    orders: new OrderRepository(database),
    supportTickets: new SupportTicketRepository(database),
  };
}
