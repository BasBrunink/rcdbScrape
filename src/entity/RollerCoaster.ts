import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class RollerCoaster {
    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    name: string

    @Column()
    parkName: string

    @Column()
    city: string

    @Column()
    state: string

    @Column()
    country: string

    @Column()
    link: string

    @Column()
    make: string

    @Column()
    model: string

    @Column()
    type: string

    @Column()
    design: string

    @Column()
    length: string

    @Column()
    height: string

    @Column()
    speed: string

    @Column()
    inversions: string

    @Column()
    verticalAngle: string

    @Column()
    duration: string

    @Column()
    gForce: string

    @Column()
    drop: string

    @Column({
        nullable: true
    })
    active?: boolean

    @Column({
        nullable: true
    })
    started?: string

    @Column({
        nullable: true
    })
    ended?: string

}

