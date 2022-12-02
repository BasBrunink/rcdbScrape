import { Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Themepark {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    name: string


    @Column({
        nullable: true
    })
    city: string

    @Column({
        nullable: true
    })
    state: string

    @Column({
        nullable: true
    })
    country: string

    @Column()
    status: string
}