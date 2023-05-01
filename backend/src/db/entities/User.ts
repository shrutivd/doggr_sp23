import { Entity, Property, Unique, OneToMany, Collection, Cascade } from "@mikro-orm/core";
import { BaseEntity } from "./BaseEntity.js";
import { Match } from "./Match.js";
import {Messages} from "./Messages.js";

@Entity({ tableName: "users"})
export class User extends BaseEntity {
	@Property()
	isAdmin: boolean = false;
	
	@Property()
	@Unique()
	email!: string;
	
	@Property()
	name!: string;
	
	@Property()
	petType!: string;

	// Note that these DO NOT EXIST in the database itself!
	@OneToMany(
		() => Match,
		match => match.owner,
		{cascade: [Cascade.PERSIST, Cascade.REMOVE]}
	)
	matches!: Collection<Match>;

	@OneToMany(
		() => Match,
		match => match.matchee,
		{cascade: [Cascade.PERSIST, Cascade.REMOVE]}
	)
	matched_by!: Collection<Match>;
	
	
	//code for messages
	//one user can send many messages
	@OneToMany(
		() => Messages,  //which table we are linking to
		messages => messages.sender  //which field on the table we are linking to
	)
	messages_sent!: Collection<Messages>;
	
	//one user can receive many messages
	@OneToMany(
		() => Messages,
		messages => messages.receiver
	)
	messages_received!: Collection<Messages>;
	

}
