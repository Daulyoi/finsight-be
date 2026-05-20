import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveFcmToken1779276611381 implements MigrationInterface {
    name = 'RemoveFcmToken1779276611381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nasabah" DROP COLUMN "fcm_token"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nasabah" ADD "fcm_token" character varying(255)`);
    }

}
