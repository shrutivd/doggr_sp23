import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import {User} from "../entities/User.js";

export class UserSeeder extends Seeder {
	async run(em: EntityManager): Promise<void> {
		em.create(User, {
			name: "Admin",
			email: "admin@email.com",
			petType: "Dog",
			isAdmin: "true"
		});

		em.create(User, {
			name: "Spot",
			email: "email@email.com",
			petType: "Dog",
			isAdmin: "false"
		});

		em.create(User, {
			name: "Dogbert",
			email: "email2@email.com",
			petType: "Dog",
			isAdmin: "false"
		});

		em.create(User, {
			name: "Doglord",
			email: "email3@email.com",
			petType: "Dog",
			isAdmin: "false"
		});

		em.create(User, {
			name: "NotaDog",
			email: "email4@email.com",
			petType: "Cat",
			isAdmin: "false"
		});
	}
}
