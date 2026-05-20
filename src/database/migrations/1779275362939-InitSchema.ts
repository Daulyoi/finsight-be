import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1779275362939 implements MigrationInterface {
    name = 'InitSchema1779275362939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "mcc_map" ("mcc_id" character varying(255) NOT NULL, "mcc_number" integer NOT NULL, CONSTRAINT "PK_01e2b14eb17204a0885522d7df5" PRIMARY KEY ("mcc_id"))`);
        await queryRunner.query(`CREATE TABLE "transaksi" ("id_transaksi" character varying(255) NOT NULL, "id_rekening" character varying(255) NOT NULL, "timestamp" TIMESTAMP NOT NULL, "tipe_mutasi" character varying(255) NOT NULL, "deskripsi_mutasi" character varying(255), "catatan_mutasi" character varying(255), "id_mcc" character varying(255), "nominal" bigint NOT NULL, "sisa_saldo" bigint NOT NULL, "label_anomali" boolean NOT NULL, "bulan" date NOT NULL, "hari_bulan" date NOT NULL, "hari_minggu" date NOT NULL, "jam" TIME NOT NULL, "menit" TIME NOT NULL, "hour_sin" character varying(255), "hour_cos" character varying(255), "month_sin" character varying(255), "month_cos" character varying(255), CONSTRAINT "PK_f130c4ac8f40bbe46abdaf8dd22" PRIMARY KEY ("id_transaksi"))`);
        await queryRunner.query(`CREATE TABLE "rekening" ("id_rekening" character varying(255) NOT NULL, "id_nasabah" character varying(255) NOT NULL, "saldo" bigint NOT NULL, "status" character varying(255) NOT NULL, CONSTRAINT "PK_d5769b3b4dbc2b0f91ccefe2036" PRIMARY KEY ("id_rekening"))`);
        await queryRunner.query(`CREATE TABLE "sejarah_persona" ("id_sejarah_persona" SERIAL NOT NULL, "id_nasabah" character varying(255) NOT NULL, "persona_dasar" character varying(255) NOT NULL, "bulan" date NOT NULL, CONSTRAINT "PK_daff80fd67c0d72f7145f8aa620" PRIMARY KEY ("id_sejarah_persona"))`);
        await queryRunner.query(`CREATE TABLE "nasabah" ("id_nasabah" character varying(255) NOT NULL, "nama_nasabah" character varying(255) NOT NULL, "tanggal_lahir" date NOT NULL, "nama_ibu_kandung" character varying(255) NOT NULL, "segmen_demografi" character varying(255), "gaji_bulanan" bigint, "persona_dasar" character varying(255), "is_dynamic" boolean NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "current_hashed_refresh_token" character varying(255), "fcm_token" character varying(255), CONSTRAINT "UQ_e7608bd239b91927ce8135d9d90" UNIQUE ("email"), CONSTRAINT "PK_e726ecd0a0287a04d902c0cacb4" PRIMARY KEY ("id_nasabah"))`);
        await queryRunner.query(`ALTER TABLE "transaksi" ADD CONSTRAINT "FK_df466aa507dc87010d4fb921288" FOREIGN KEY ("id_rekening") REFERENCES "rekening"("id_rekening") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "transaksi" ADD CONSTRAINT "FK_330719956465eb6144acbfe650b" FOREIGN KEY ("id_mcc") REFERENCES "mcc_map"("mcc_id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rekening" ADD CONSTRAINT "FK_a5fb85d31e2fce52a30a324898c" FOREIGN KEY ("id_nasabah") REFERENCES "nasabah"("id_nasabah") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "sejarah_persona" ADD CONSTRAINT "FK_e45a967f885c77931a99c4cdfb4" FOREIGN KEY ("id_nasabah") REFERENCES "nasabah"("id_nasabah") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sejarah_persona" DROP CONSTRAINT "FK_e45a967f885c77931a99c4cdfb4"`);
        await queryRunner.query(`ALTER TABLE "rekening" DROP CONSTRAINT "FK_a5fb85d31e2fce52a30a324898c"`);
        await queryRunner.query(`ALTER TABLE "transaksi" DROP CONSTRAINT "FK_330719956465eb6144acbfe650b"`);
        await queryRunner.query(`ALTER TABLE "transaksi" DROP CONSTRAINT "FK_df466aa507dc87010d4fb921288"`);
        await queryRunner.query(`DROP TABLE "nasabah"`);
        await queryRunner.query(`DROP TABLE "sejarah_persona"`);
        await queryRunner.query(`DROP TABLE "rekening"`);
        await queryRunner.query(`DROP TABLE "transaksi"`);
        await queryRunner.query(`DROP TABLE "mcc_map"`);
    }

}
