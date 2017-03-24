"""
Copyright 2017, Institute for Systems Biology
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import os
import traceback
import sys
import time
from MySQLdb import connect, cursors
from GenespotRE import secret_settings, settings
from argparse import ArgumentParser

SUPERUSER_NAME = 'isb'


def get_mysql_connection():
    db_settings = secret_settings.get('DATABASE')['default'] if settings.IS_DEV else settings.DATABASES['default']

    db = None
    ssl = None

    if 'OPTIONS' in db_settings and 'ssl' in db_settings['OPTIONS']:
        ssl = db_settings['OPTIONS']['ssl']

    if settings.IS_APP_ENGINE_FLEX:
        # Connecting from App Engine
        db = connect(
            host='localhost',
            unix_socket=settings.DB_SOCKET,
            db=db_settings['NAME'],
            user=db_settings['USER'],
            password=db_settings['PASSWORD']
        )
    else:
        db = connect(host=db_settings['HOST'], port=db_settings['PORT'], db=db_settings['NAME'],
                     user=db_settings['USER'], passwd=db_settings['PASSWORD'], ssl=ssl)

    return db

# Insert any missing programs and projects into Django tables
def create_programs_and_projects(debug):
    db = None
    cursor = None

    insert_programs = "INSERT INTO projects_program (name, active, last_date_saved, is_public, owner_id) " + \
                      "VALUES (%s,%s,%s,%s,%s);"

    get_project_list = "SELECT project_short_name, name FROM {0} WHERE endpoint_type='current';"

    insert_projects = "INSERT INTO projects_project (name, description, active, last_date_saved, owner_id, program_id) " + \
                     "VALUES (%s,%s,%s,%s,%s,%s);"

    insert_metadata_tables = """
      INSERT INTO projects_public_metadata_tables (samples_table, attr_table, sample_data_availability_table,
        sample_data_type_availability_table, clin_table, biospec_table, data_tables_id, {0} program_id)
      VALUES({1});
    """
    update_metadata_tables = """
      UPDATE projects_public_metadata_tables
      SET samples_table = %s, attr_table = %s, sample_data_availability_table = %s,
        sample_data_type_availability_table = %s, clin_table = %s, biospec_table = %s, {0} data_tables_id = %s
      WHERE id = %s;
    """

    insert_data_tables = """
      INSERT INTO projects_public_data_tables (data_table, {0} build, program_id)
      VALUES({1});
    """

    insert_annot_tables = """
      INSERT INTO projects_public_annotation_tables ({0} program_id)
      VALUES({1});
    """

    programs_to_insert = ['TARGET']

    projects_to_insert = ['CCLE', 'TARGET']

    program_tables_to_insert = {
        'TCGA': {
            'annot': ['annot', 'biospec', 'clin', 'sample'],
            'data': {'HG19': 1, 'HG38': 1}
        },
        'CCLE': {
            'data': {'HG19': 0}
        },
        'TARGET': {
            'data': {'HG19': 0, 'HG38': 0}
        }
    }

    try:
        db = get_mysql_connection()
        cursor = db.cursor()

        isb_userid = None

        cursor.execute("SELECT id FROM auth_user WHERE username = %s AND is_active = 1 AND is_superuser = 1;", (SUPERUSER_NAME,))

        for row in cursor.fetchall():
            isb_userid = row[0]

        if isb_userid is None:
            raise Exception("Couldn't retrieve ID for isb user!")

        for prog in programs_to_insert:
            cursor.execute('SELECT * FROM projects_program WHERE name=%s;', (prog,))
            check = cursor.fetchall()
            if len(check):
                print >> sys.stdout, "Found program "+prog+", insert skipped."
            else:
                insertTime = time.strftime('%Y-%m-%d %H:%M:%S')
                values = (prog, True, insertTime, True, isb_userid, )

                if debug:
                    print >> sys.stdout, "Executing statement: " + insert_programs
                    print >> sys.stdout, "with values: " + str(values)
                else:
                    cursor.execute(insert_programs, values)

        if not debug:
            db.commit()

        for prog in program_tables_to_insert:
            prog_tables = program_tables_to_insert[prog]

            prog_id = None

            if not debug:
                cursor.execute('SELECT id FROM projects_program WHERE name=%s AND active = 1 AND is_public = 1 AND owner_id = %s;', (prog, isb_userid,))
                prog_id = cursor.fetchall()[0][0]

            cursor.execute('SELECT id FROM projects_public_data_tables WHERE program_id = %s;', (prog_id,))

            check = cursor.fetchall()

            data_tables = None

            if len(check):
                data_tables = check[0][0]
            else:
                for build in prog_tables['data']:
                    values = (prog+'_metadata_data_'+build,)
                    insert_data_tables_opt_fields = ''
                    if prog_tables['data'][build]:
                        values += (prog+'_metadata_annotation2data_'+build,)
                        insert_data_tables_opt_fields = 'annot2data_table,'
                    values += (build, prog_id,)

                    param_set = ("%s," * len(values))[:-1]

                    if debug:
                        print >> sys.stdout, "Executing statement: "+insert_data_tables.format(insert_data_tables_opt_fields, param_set)
                        print >> sys.stdout, "Values: "+str(values)
                    else:
                        cursor.execute(insert_data_tables.format(insert_data_tables_opt_fields, param_set), values)
                        cursor.execute('SELECT id FROM projects_public_data_tables WHERE program_id = %s AND build = %s;', (prog_id, build,))
                        data_tables = cursor.fetchall()[0][0]

            annot_tables = None

            cursor.execute('SELECT id FROM projects_public_annotation_tables WHERE program_id = %s;', (prog_id,))

            check = cursor.fetchall()

            if len(check):
                annot_tables = check[0][0]
            else:
                if 'annot' in prog_tables:
                    values = ()
                    insert_annot_tables_fields = ''
                    annot_table_set = prog_tables['annot']

                    if 'annot' in annot_table_set:
                        values += (prog+'_metadata_annotation',)
                        insert_annot_tables_fields += 'annot_table,'
                    if 'biospec' in annot_table_set:
                        values += (prog+'_metadata_annotation2biospecimen',)
                        insert_annot_tables_fields += 'annot2biospec_table,'
                    if 'clin' in annot_table_set:
                        values += (prog+'_metadata_annotation2clinical',)
                        insert_annot_tables_fields += 'annot2clin_table,'
                    if 'sample' in annot_table_set:
                        values += (prog+'_metadata_annotation2samples',)
                        insert_annot_tables_fields += 'annot2sample_table,'

                    values += (prog_id,)

                    param_set = ("%s," * len(values))[:-1]

                    if debug:
                        print >> sys.stdout, "Executing statment: "+ insert_annot_tables.format(insert_annot_tables_fields, param_set)
                        print >> sys.stdout, "Values: "+str(values)
                    else:
                        cursor.execute(insert_annot_tables.format(insert_annot_tables_fields, param_set), values)
                        cursor.execute('SELECT id FROM projects_public_annotation_tables WHERE program_id = %s;', (prog_id,))
                        annot_tables = cursor.fetchall()[0][0]

            insert_metadata_tables_opt_fields = ''

            cursor.execute('SELECT * FROM projects_public_metadata_tables WHERE id=%s;', (prog_id,))
            results = cursor.fetchall()
            is_update = len(results) > 0

            values = (prog + '_metadata_samples', prog + '_metadata_attrs',
                prog + '_metadata_data_availability', prog + '_metadata_data_type_availability',
                prog + '_metadata_clinical', prog + '_metadata_biospecimen', data_tables,)

            if annot_tables:
                values += (annot_tables,)
                if is_update:
                    insert_metadata_tables_opt_fields = 'annot_tables_id = %s,'
                else:
                    insert_metadata_tables_opt_fields = 'annot_tables_id,'

            values += (prog_id,)

            if is_update:
                if debug:
                    print >> sys.stdout, "Executing statement: "+update_metadata_tables.format(insert_metadata_tables_opt_fields)
                    print >> sys.stdout, " with values "+ str(values)
                else:
                    cursor.execute(update_metadata_tables.format(insert_metadata_tables_opt_fields), values)
            else:
                param_set = ("%s," * len(values))[:-1]
                if debug:
                    print >> sys.stdout, "Exeucting statement: "+update_metadata_tables.format(insert_metadata_tables_opt_fields,param_set)
                    print >> sys.stdout, " with values "+ str(values)
                else:
                    cursor.execute(insert_metadata_tables.format(insert_metadata_tables_opt_fields,param_set), values)

        if not debug: db.commit()

        for prog in projects_to_insert:

            prog_proj_table = prog+'_metadata_project'

            prog_id = None

            cursor.execute('SELECT id FROM projects_program WHERE name=%s;', (prog,))
            results = cursor.fetchall()
            if len(results):
                prog_id = results[0][0]

            cursor.execute(get_project_list.format(prog_proj_table))

            prog_leader = prog+'-'

            for row in cursor.fetchall():
                cursor.execute('SELECT * FROM projects_project WHERE program_id = %s AND name=%s;', (prog_id, row[0][len(prog_leader):],))

                check = cursor.fetchall()

                if len(check):
                    print >> sys.stdout, "Project "+row[0]+" is already in the projects_project table, skipping"
                else:
                    insertTime = time.strftime('%Y-%m-%d %H:%M:%S')
                    values = (row[0][len(prog_leader):], row[1], True, insertTime, isb_userid, prog_id,)
                    if debug:
                        print >> sys.stdout, "Executing statement: "+insert_projects
                        print >> sys.stdout, "Values: " + str(values)
                    else:
                        cursor.execute(insert_projects, values)

            if not debug: db.commit()

    except Exception as e:
        print >> sys.stdout, traceback.format_exc()
    finally:
        if cursor: cursor.close()
        if db and db.open: db.close()


# Add case barcodes to the cohorts_samples table (currently not present)
def fix_case_barcodes_in_cohorts(debug):

    db = None
    cursor = None

    fix_tcga_case_barcodes = """
        UPDATE cohorts_samples cs
        JOIN TCGA_metadata_samples ms
        ON ms.sample_barcode = cs.sample_barcode
        SET cs.case_barcode = ms.case_barcode
        WHERE cs.case_barcode IS NULL;
    """

    fix_ccle_case_barcodes = """
            UPDATE cohorts_samples cs
            JOIN (
                SELECT SampleBarcode AS sms, cms.sample_barcode, cms.case_barcode
                FROM metadata_samples ms
                JOIN CCLE_metadata_samples cms
                ON cms.case_barcode = ms.ParticipantBarcode
                WHERE SampleBarcode LIKE 'CCLE%'
            ) ms
            ON ms.sms = cs.sample_barcode
            SET cs.sample_barcode = ms.sample_barcode, cs.case_barcode = ms.case_barcode
            WHERE cs.sample_barcode LIKE 'CCLE%';
    """

    try:
        db = get_mysql_connection()
        cursor = db.cursor()

        if debug:
            print >> sys.stdout, "Executing statement: "+fix_tcga_case_barcodes
        else:
            cursor.execute(fix_tcga_case_barcodes)

        if debug:
            print >> sys.stdout, "Executing statement: " + fix_ccle_case_barcodes
        else:
            cursor.execute(fix_ccle_case_barcodes)

    except Exception as e:
        print >> sys.stdout, traceback.format_exc()
    finally:
        if cursor: cursor.close()
        if db and db.open: db.close()


# Currently only CCLE's projects are incorrect (they're all the 'CCLE' project) but if others need to be done they can be added
# to the program_cohorts_to_update list
def fix_cohort_projects(debug):

    db = None
    cursor = None

    try:
        db = get_mysql_connection()
        cursor = db.cursor()

        isb_userid = None

        cursor.execute("SELECT id FROM auth_user WHERE username = %s AND is_active = 1 AND is_superuser = 1;", (SUPERUSER_NAME,))

        for row in cursor.fetchall():
            isb_userid = row[0]

        if isb_userid is None:
            raise Exception("Couldn't retrieve ID for isb user!")

        program_cohorts_to_update = ['CCLE']

        for prog in program_cohorts_to_update:
            cursor.execute("SELECT id FROM projects_program WHERE name=%s and active = 1 and owner_id = %s;", (prog, isb_userid,))

            for row in cursor.fetchall():
                program_id = row[0]

            if program_id is None:
                raise Exception("Couldn't retrieve ID for {0} program!".format(prog))

            fix_cohort_projects = """
                UPDATE cohorts_samples cs
                JOIN {0}_metadata_samples ms
                ON ms.sample_barcode = cs.sample_barcode
                JOIN projects_project pp
                ON ms.project_disease_type = pp.name
                SET cs.project_id = pp.id
                WHERE pp.program_id = %s;
            """

        values = (program_id, )

        if debug:
            print >> sys.stdout, "Executing statement: "+fix_cohort_projects.format(prog)
            print >> sys.stdout, "Values: "+str(values)
        else:
            cursor.execute(fix_cohort_projects.format(prog), values)

    except Exception as e:
        print >> sys.stdout, traceback.format_exc()
    finally:
        if cursor: cursor.close()
        if db and db.open: db.close()


# Create the display-string storage table for attributes and their values which are not displayed as they're stored in the database,
# eg. Sample Type Code, Smoking History. The attribute is always required (to associate the correct display string for a value), but
# if this is a display string for an attribute value_name can be null. Program ID is optional, to allow for different programs to have
# different display values.
def make_attr_display_table(debug):

    cursor = None
    db = None

    try:

        db = get_mysql_connection()
        cursor = db.cursor()

        table_create_statement = """
            CREATE TABLE IF NOT EXISTS attr_value_display (
              attr_name VARCHAR(100) NOT NULL, value_name VARCHAR(100), display_string VARCHAR(256) NOT NULL, preformatted TINYINT(1) DEFAULT 1 NOT NULL, program_id INT
            );
        """

        cursor.execute(table_create_statement)

        # some test values - will replace with actual LOAD INTO at a later time
        insert_statement = """
            INSERT INTO attr_value_display(attr_name,value_name,display_string,program_id) VALUES(%s,%s,%s,%s)
        """

        # get the ISB superuser ID
        cursor.execute("""
            SELECT id
            FROM auth_user
            WHERE username = 'isb' AND is_superuser = 1 AND is_active = 1
        """)

        suid = cursor.fetchall()[0][0]

        public_program_ids = []

        # get the public program IDs
        cursor.execute("""
            SELECT id
            FROM projects_program
            WHERE owner_id = %s AND is_public = 1 AND active = 1
        """, (suid,))

        for row in cursor.fetchall():
            public_program_ids.append(row[0])

        displs = {
            'BMI': {
                'underweight': 'Underweight: BMI less than 18.5',
                'normal weight': 'Normal weight: BMI is 18.5 - 24.9',
                'overweight': 'Overweight: BMI is 25 - 29.9',
                'obese': 'Obese: BMI is 30 or more',
            },
            'sample_type': {
                '01': 'Primary Solid Tumor',
                '02': 'Recurrent Solid Tumor',
                '03': 'Primary Blood Derived Cancer - Peripheral Blood',
                '04': 'Recurrent Blood Derived Cancer - Bone Marrow',
                '05': 'Additional - New Primary',
                '06': 'Metastatic',
                '07': 'Additional Metastatic',
                '08': 'Human Tumor Original Cells',
                '09': 'Primary Blood Derived Cancer - Bone Marrow',
                '10': 'Blood Derived Normal',
                '11': 'Solid Tissue Normal',
                '12': 'Buccal Cell Normal',
                '13': 'EBV Immortalized Normal',
                '14': 'Bone Marrow Normal',
                '20': 'Control Analyte',
                '40': 'Recurrent Blood Derived Cancer - Peripheral Blood',
                '50': 'Cell Lines',
                '60': 'Primary Xenograft Tissue',
                '61': 'Cell Line Derived Xenograft Tissue',
                'None': 'NA',
            },
            'tobacco_smoking_history': {
                '1': 'Lifelong Non-smoker',
                '2': 'Current Smoker',
                '3': 'Current Reformed Smoker for > 15 years',
                '4': 'Current Reformed Smoker for <= 15 years',
                '5': 'Current Reformed Smoker, Duration Not Specified',
                '6': 'Smoker at Diagnosis',
                '7': 'Smoking History Not Documented',
                'None': 'NA',
            },
            'somatic_mutation': {
                'Missense_Mutation': 'Missense Mutation',
                'Frame_Shift_Del': 'Frame Shift - Deletion',
                'Frame_Shift_Ins': 'Frame Shift - Insertion',
                'De_novo_Start_OutOfFrame': 'De novo Start Out of Frame',
                'De_novo_Start_InFrame': 'De novo Start In Frame',
                'In_Frame_Del': 'In Frame Deletion',
                'In_Frame_Ins': 'In Frame Insertion',
                'Nonsense_Mutation': 'Nonsense Mutation',
                'Start_Codon_SNP': 'Start Codon - SNP',
                'Start_Codon_Del': 'Start Codon - Deletion',
                'Start_Codon_Ins': 'Start Codon - Insertion',
                'Stop_Codon_Del': 'Stop Codon - Deletion',
                'Stop_Codon_Ins': 'Stop Codon - Insertion',
                'Nonstop_Mutation': 'Nonstop Mutation',
                'Silent': 'Silent',
                'RNA': 'RNA',
                'Intron': 'Intron',
                'lincRNA': 'lincRNA',
                'Splice_Site': 'Splice Site',
                "3'UTR": '3\' UTR',
                "5'UTR": '5\' UTR',
                'IGR': 'IGR',
                "5'Flank": '5\' Flank',
            }
        }

        for pid in public_program_ids:
            for attr in displs:
                for val in displs[attr]:
                    vals = (attr,val,displs[attr][val],pid,)
                    cursor.execute(insert_statement,vals)

            vals = ('tobacco_smoking_history',None,'Tobacco Smoking History',pid,)
            cursor.execute(insert_statement,vals)
            vals = ('sample_type', None, 'Sample Type', pid,)
            cursor.execute(insert_statement, vals)
            vals = ('hpv_status', None, 'HPV Status', pid,)
            cursor.execute(insert_statement, vals)

        db.commit()

    except Exception as e:
        print >> sys.stdout, "[ERROR] Exception when adding the attr_value_display table - it may not have been properly generated!"
        print >> sys.stdout, e
        print >> sys.stdout, traceback.format_exc()
    finally:
        if cursor: cursor.close()
        if db and db.open: db.close()


""" main """

def main():

    # To disable any of these by default, change the default to False
    cmd_line_parser = ArgumentParser(description="Script to migrate the database to the new multi-program format.")

    cmd_line_parser.add_argument('-p', '--create-prog-proj', type=bool, default=False,
                                 help="Add the program and project entries to the Django tables.")

    cmd_line_parser.add_argument('-c', '--fix-cohort-projects', type=bool, default=False,
                                 help="Fix any cohort entries to contain the correct project ID")

    cmd_line_parser.add_argument('-b', '--debug-mode', type=bool, default=False,
                                 help="Don't execute statements, just print them with their paramter tuples.")

    cmd_line_parser.add_argument('-a', '--attr_displ_table', type=bool, default=False,
                                 help="Add and bootstrap the metadata attribute display table.")

    cmd_line_parser.add_argument('-d', '--fix-case-id', type=bool, default=False,
                                 help="Add case barcodes to the cohorts_samples table for extent cohorts")

    args = cmd_line_parser.parse_args()

    try:
        args.create_prog_proj and create_programs_and_projects(args.debug_mode)
        args.fix_ccle_cohorts and fix_cohort_projects(args.debug_mode)
        args.attr_displ_table and make_attr_display_table(args.debug_mode)
        args.fix_case_id and fix_case_barcodes_in_cohorts(args.debug_mode)

    except Exception as e:
        print >> sys.stdout, traceback.format_exc()

if __name__ == "__main__":
    main()