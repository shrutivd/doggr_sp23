
import {Entity, Property, Unique, ManyToOne, PrimaryKey} from "@mikro-orm/core";
import {RenameLocation} from "ts-morph";
import { BaseEntity } from "./BaseEntity.js";
import { User } from "./User.js";
import type {Rel} from '@mikro-orm/core';



@Entity()
export class Messages extends BaseEntity{
	
	
	//code for sender
	@ManyToOne()   //one user can send many messages
	//the person who sends the message
	sender!: Rel<User>; //sender is going to be an user
	
	//code for receiver
	@ManyToOne() //one receiver can receive many messages
	//The person who receives the message
	receiver!: Rel<User>; //receiver is going to be an user
	
	@Property()
	message_data: string;
	
	
	
}


