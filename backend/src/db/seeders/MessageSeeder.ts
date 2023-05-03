import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Messages } from "../entities/Messages.js";
import {User} from "../entities/User.js";

export class MessageSeeder extends Seeder {

	async run(em: EntityManager): Promise<void> {
		const admin = await em.findOne(User, { email: "admin@email.com" });
		const user1 = await em.findOne(User, { email: "email@email.com" });
		const user2 = await em.findOne(User, { email: "email2@email.com" });
		const user3 = await em.findOne(User, { email: "email3@email.com" });
		const user4 = await em.findOne(User, { email: "email4@email.com" });

		em.create(Messages, {
			sender: admin,
			receiver: user1,
			message_data: "This is a message from admin"
		});
		em.create(Messages, {
			sender: user1,
			receiver: user2,
			message_data: "This is a message from spot"
		});
		em.create(Messages, {
			sender: user2,
			receiver: user3,
			message_data: "This is a message from Dogbert"
		});
		em.create(Messages, {
			sender: user3,
			receiver: user1,
			message_data: "This is a message from Doglord"
		});
		em.create(Messages, {
			sender: user1,
			receiver: admin,
			message_data: "This is a message from spot"
		});
		em.create(Messages, {
			sender: user1,
			receiver: user2,
			message_data: "This is a message from spot"
		});
		em.create(Messages, {
			sender: user3,
			receiver: admin,
			message_data: "This is a message from Doglord"
		});
		em.create(Messages, {
			sender: user4,
			receiver: user1,
			message_data: "This is a message from Not-a-dog"
		});
	}
}
