use care;
select * from patient_demographics;
select * from hf_registry;
select * from hf_administrative;


-- 1. Drop the existing foreign key constraint
ALTER TABLE [dbo].[hf_registry] DROP CONSTRAINT [fk_hf_patient];
GO

-- 2. Rename the column from patient_id to reg_patient_id
EXEC sp_rename '[dbo].[hf_registry].patient_id', 'reg_patient_id', 'COLUMN';
GO

-- 3. Recreate the foreign key constraint pointing to patient_demographics (using reg_patient_id)
ALTER TABLE [dbo].[hf_registry] WITH CHECK ADD CONSTRAINT [fk_hf_patient] 
FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
GO

ALTER TABLE [dbo].[hf_registry] CHECK CONSTRAINT [fk_hf_patient];
GO

EXEC sp_rename '[dbo].[patient_demographics].patient_id', 'reg_patient_id', 'COLUMN';



-- 1. Drop the existing foreign key constraint
ALTER TABLE [dbo].[stemi_registry] DROP CONSTRAINT [fk_stemi_patient];
GO

-- 2. Rename the column from patient_id to reg_patient_id
EXEC sp_rename '[dbo].[stemi_registry].patient_id', 'reg_patient_id', 'COLUMN';
GO

-- 3. Recreate the foreign key constraint pointing to patient_demographics (using reg_patient_id)
ALTER TABLE [dbo].[stemi_registry] WITH CHECK ADD CONSTRAINT [fk_stemi_patient] 
FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
GO

ALTER TABLE [dbo].[stemi_registry] CHECK CONSTRAINT [fk_stemi_patient];
GO


-- 1. Drop the existing foreign key constraint
ALTER TABLE [dbo].[nstemi_registry] DROP CONSTRAINT [fk_nstemi_patient];
GO

-- 2. Rename the column from patient_id to reg_patient_id
EXEC sp_rename '[dbo].[nstemi_registry].patient_id', 'reg_patient_id', 'COLUMN';
GO

-- 3. Recreate the foreign key constraint pointing to patient_demographics (using reg_patient_id)
ALTER TABLE [dbo].[nstemi_registry] WITH CHECK ADD CONSTRAINT [fk_nstemi_patient] 
FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
GO

ALTER TABLE [dbo].[nstemi_registry] CHECK CONSTRAINT [fk_nstemi_patient];
GO


-- 1. Drop the existing foreign key constraint
ALTER TABLE [dbo].[cabg_registry] DROP CONSTRAINT [fk_cabg_patient];
GO

-- 2. Rename the column from patient_id to reg_patient_id
EXEC sp_rename '[dbo].[cabg_registry].patient_id', 'reg_patient_id', 'COLUMN';
GO

-- 3. Recreate the foreign key constraint pointing to patient_demographics (using reg_patient_id)
ALTER TABLE [dbo].[cabg_registry] WITH CHECK ADD CONSTRAINT [fk_cabg_patient] 
FOREIGN KEY([reg_patient_id]) REFERENCES [dbo].[patient_demographics] ([reg_patient_id]);
GO

ALTER TABLE [dbo].[cabg_registry] CHECK CONSTRAINT [fk_cabg_patient];
GO


ALTER TABLE [dbo].[patient_demographics]
ADD [uhid] [varchar](50) NULL,
    [abha_number] [varchar](50) NULL;
GO