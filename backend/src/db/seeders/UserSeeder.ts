import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

export class UserSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {}

}
