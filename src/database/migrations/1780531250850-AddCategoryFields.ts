import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryFields1780531250850 implements MigrationInterface {
    name = 'AddCategoryFields1780531250850'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaksi" ADD "kategori_besar" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "transaksi" ADD "kategori_detail" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaksi" DROP COLUMN "kategori_detail"`);
        await queryRunner.query(`ALTER TABLE "transaksi" DROP COLUMN "kategori_besar"`);
    }

}
