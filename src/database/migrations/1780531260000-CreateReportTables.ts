import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReportTables1780531260000 implements MigrationInterface {
    name = 'CreateReportTables1780531260000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "weekly_reports" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" character varying(255) NOT NULL, "report_date" DATE NOT NULL, "period_start" DATE NOT NULL, "period_end" DATE NOT NULL, "persona" character varying(255) NOT NULL, "wants_ratio" numeric(5,4) NOT NULL, "needs_ratio" numeric(5,4) NOT NULL, "total_pengeluaran" bigint NOT NULL, "anomali_count" integer NOT NULL DEFAULT 0, "report_text" text NOT NULL, "generated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_weekly_reports" PRIMARY KEY ("id"), CONSTRAINT "UQ_weekly_reports_user_date" UNIQUE ("user_id", "report_date"))`);
        await queryRunner.query(`CREATE TABLE "monthly_reports" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" character varying(255) NOT NULL, "target_month" character(7) NOT NULL, "persona" character varying(255) NOT NULL, "persona_sebelum" character varying(255), "savings_rate" numeric(6,4) NOT NULL, "wants_ratio" numeric(5,4) NOT NULL, "needs_ratio" numeric(5,4) NOT NULL, "wants_amount" bigint NOT NULL, "needs_amount" bigint NOT NULL, "savings_amount" bigint NOT NULL, "behavioral_features" jsonb, "report_text" text NOT NULL, "generated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_monthly_reports" PRIMARY KEY ("id"), CONSTRAINT "UQ_monthly_reports_user_month" UNIQUE ("user_id", "target_month"))`);
        await queryRunner.query(`CREATE TABLE "detected_anomalies" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "id_transaksi" character varying(255) NOT NULL, "user_id" character varying(255) NOT NULL, "report_type" character varying(10) NOT NULL, "report_id" UUID NOT NULL, "kategori_detail" character varying(255) NOT NULL, "nominal" bigint NOT NULL, "mae" double precision NOT NULL, "threshold_val" double precision NOT NULL, "ratio" double precision NOT NULL, "anomaly_context" text, "detected_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_detected_anomalies" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "weekly_reports" ADD CONSTRAINT "FK_weekly_reports_user" FOREIGN KEY ("user_id") REFERENCES "nasabah"("id_nasabah") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "monthly_reports" ADD CONSTRAINT "FK_monthly_reports_user" FOREIGN KEY ("user_id") REFERENCES "nasabah"("id_nasabah") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`CREATE INDEX "idx_weekly_reports_user_date" ON "weekly_reports" ("user_id", "report_date" DESC)`);
        await queryRunner.query(`CREATE INDEX "idx_monthly_reports_user_month" ON "monthly_reports" ("user_id", "target_month" DESC)`);
        await queryRunner.query(`CREATE INDEX "idx_anomalies_user" ON "detected_anomalies" ("user_id", "detected_at" DESC)`);
        await queryRunner.query(`ALTER TABLE "nasabah" ADD "current_ratio_needs" numeric(5,2) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "nasabah" ADD "current_ratio_wants" numeric(5,2) NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nasabah" DROP COLUMN "current_ratio_wants"`);
        await queryRunner.query(`ALTER TABLE "nasabah" DROP COLUMN "current_ratio_needs"`);
        await queryRunner.query(`DROP INDEX "idx_anomalies_user"`);
        await queryRunner.query(`DROP INDEX "idx_monthly_reports_user_month"`);
        await queryRunner.query(`DROP INDEX "idx_weekly_reports_user_date"`);
        await queryRunner.query(`ALTER TABLE "monthly_reports" DROP CONSTRAINT "FK_monthly_reports_user"`);
        await queryRunner.query(`ALTER TABLE "weekly_reports" DROP CONSTRAINT "FK_weekly_reports_user"`);
        await queryRunner.query(`DROP TABLE "detected_anomalies"`);
        await queryRunner.query(`DROP TABLE "monthly_reports"`);
        await queryRunner.query(`DROP TABLE "weekly_reports"`);
    }
}
