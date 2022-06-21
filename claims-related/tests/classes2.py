import re
from itertools import takewhile

class Measure:

    def __init__(self, id, filename):
        self.id = id
        self.filename = filename
        self.eligibility_options = None
        self.measure_id = None
        self.performance_options = None

    def __str__(self):
        return f"""
        ID: {self.id}
            eligibilityOptions: {", ".join([str(eo) for eo in self.eligibility_options])}
            measureId: {self.measure_id}
            performanceOptions: { "".join([str(po) for po in self.performance_options ])}"""

    def __repr__(self):
        return f"Measure {self.id}"

    def compare(self, other):
        print("\n\n","-"*50)
        print(f"DIFF REPORT FOR MEASURE {self.id}")
        print("-"*50)
        if not self.id_eq:
            print("IDs not equal")
        if not all(self.eligibility_options_eq):
            # pass
            print("***** Eligibility Options Details:")
            self.get_eo_diff(other)
        if not all(self.performance_options_eq):
            print("***** Performance Options Details:")
            self.get_po_diff(other)

    def get_po_diff(self, other):
        common1 = [po1 for po1 in self.performance_options if po1.quality_codes[0].code in [po2.quality_codes[0].code for po2 in other.performance_options]]
        common2 = list(reversed([po2 for po2 in other.performance_options if po2.quality_codes[0].code in [po1.quality_codes[0].code for po1 in self.performance_options]]))

        common_quality_codes = [po2.quality_codes[0].code for po2 in common1]
        print(f"There are {len(common_quality_codes)} common performance options (by quality code): ", common_quality_codes)
        quality_codes_only_in_po1 = [x for x in [po2.quality_codes[0].code for po2 in sorted(self.performance_options)] if x not in common_quality_codes]
        quality_codes_only_in_po2 = [x for x in [po2.quality_codes[0].code for po2 in sorted(other.performance_options)] if x not in common_quality_codes]

        print(f"There are {len(quality_codes_only_in_po1)} (performance options) quality_codes_only_in_po1: {quality_codes_only_in_po1}")
        print(f"There are {len(quality_codes_only_in_po2)} (performance options) quality_codes_only_in_po2: {quality_codes_only_in_po2}")

        in_1_not_in_2 = [po1 for po1 in self.performance_options if po1.quality_codes[0].code not in [comm.quality_codes[0].code for comm in common1] ]
        in_2_not_in_1 = [po2 for po2 in other.performance_options if po2.quality_codes[0].code not in [comm.quality_codes[0].code for comm in common1] ]

        print(f"Performance options in 1 not in 2: ")
        for x in in_1_not_in_2:
            print(x)
        print(f"Performance options in 2 not in 1: ")
        for x in in_2_not_in_1:
            print(x)
        
        common_po_pairs = [(po1, po2) for po1,po2 in zip(common1, common2)]
        print("Common Performance option pairs:")
        for po1, po2 in common_po_pairs:
            # print(f"looking at common po pairs")
            should_print = False
            for attr in po1.__dict__.keys():
                # # print(attr, "\n")
                if po1.__dict__[attr] != po2.__dict__[attr]:
                    should_print = True
            if should_print:
                print(f"po1: {po1}")
                print(f"po2: {po2}")
                print("-"*50)
                #     if attr == "quality_codes":
                #         key = "code"
                #         # print(attr)
                #         # self.handle_po_diff(po1.__dict__[attr], po2.__dict__[attr])
                #         self.get_missing_measures(po1.__dict__[attr], po2.__dict__[attr], key, attr, other.filename)
                #         common_measures = self.get_common_measures(po1.__dict__[attr], po2.__dict__[attr], key)
                #         # print("common_measures: ")
                #         # print(common_measures)
                #         self.compare_common_pairs(common_measures, other.filename)


                #     elif attr in ["option_type"]:
                #         self.handle_simple_attribute(attr, other.filename, po1.__dict__[attr], po2.__dict__[attr])
                #     elif attr in ["option_group"]:
                #         print("option_group redo")
                #         self.handle_simple_attribute(attr, other.filename, po1.__dict__[attr], po2.__dict__[attr])
                #         print("...")
                #         print(po1)
                #         print(po2)
                #         # print([str(x) for x in po1.__dict__["quality_codes"]])
                #         # print([str(x) for x in po2.__dict__["quality_codes"]])
                #     else:
                #         raise NotImplementedError(f"You need to account for {attr}")

    def get_eo_diff(self, other):
        # pass
        # print(", ".join([str(eo) for eo in self.eligibility_options]))
        eo_pairs = [(eo1, eo2) for eo1,eo2 in zip(self.eligibility_options, other.eligibility_options)]
        # print(f"len of EOs: {len(self.eligibility_options)}, {len(other.eligibility_options)} {len(eo_pairs)}")
        for eo1, eo2 in eo_pairs:
            for attr in eo1.__dict__.keys():
                # print(f"eo1 {attr} == eo2 {attr}: {eo1.__dict__[attr] == eo2.__dict__[attr]}")
                if eo1.__dict__[attr] != eo2.__dict__[attr]:
        #             # print("------- not equal")
                    if attr == "procedure_codes" or attr == "additional_procedure_codes":
                        key = "code"
                        self.get_missing_measures(eo1.__dict__[attr], eo2.__dict__[attr], key, attr, other.filename)
                        common_measures = self.get_common_measures(eo1.__dict__[attr], eo2.__dict__[attr], key, attr)
                        self.compare_common_pairs(common_measures, other.filename, attr)
                    elif attr == "diagnosis_codes":
                        # print(f"Differing Diagnosis Codes Pair:")
                        self.get_missing_measures_lists(eo1.__dict__[attr], eo2.__dict__[attr], attr, other.filename)
                        print()
                    elif attr in ["option_group", "min_age"]:
                        self.handle_simple_attribute(attr, other.filename, eo1.__dict__[attr], eo2.__dict__[attr])
                    else:
                        raise NotImplementedError(f"You need to account for {attr}")

    def handle_po_diff(self, po1, po2):
        print("Differing {attr} Pair: ")
        print([str(x) for x in po1])
        print([str(x) for x in po2])



    def handle_simple_attribute(self, attr, other_filename, eo1, eo2):
        print(f"Differing {attr} Pair:")
        print(f"{self.filename} eligibilityOptions.{attr} = {eo1}")
        print(f"{other_filename} eligibilityOptions.{attr} = {eo2}")
        print()


    def get_common_measures(self, measures1, measures2, key, attr):
        if not measures1 and not measures2:
            return list(zip([], [])) #[tuple(), tuple()]
        if not measures1:
            return list(zip([], measures2))
        if not measures2:
            return list(zip(measures1, []))
        # print(f"len common measures1: {len(measures1[0].__dict__[key])}")
        # print(f"len common measures2: {len(measures2[0].__dict__[key])}")
        # print("commmon measures1", measures1[0].__dict__[key])
        # print("common measures2", measures2[0].__dict__[key])
        common_measue1 = [m for m in measures1 if m.__dict__[key]  in [m.__dict__[key] for m in measures2]] 
        common_measure2 = [m for m in measures2 if m.__dict__[key] in [m.__dict__[key] for m in measures1]]
        return list(zip(common_measue1, common_measure2))


    def compare_common_pairs(self, common_measures, other_filename, attr):
        # print(attr, common_measures)
        for m1,m2 in common_measures:
            if m1 == m2:
                pass
            else:
                print(f"Differing {attr} Pair for code {m1.code}:")
                print(f"{attr} from {self.filename}: {m1}")
                print(f"{attr} from {other_filename}: {m2}")


    def get_missing_measures_lists(self, measures1, measures2, attr, other_filename):
        in_1_not_2 = [m for m in measures1 if m not in measures2]
        if in_1_not_2: print(f"{attr} in {self.filename} but not in {other_filename}:", ", \n".join(in_1_not_2))
        in_2_not_1 = [m for m in measures2 if m not in measures1]
        if in_2_not_1: print(f"{attr} in {other_filename} but not in {self.filename}:", ", \n".join(in_2_not_1))

    def get_missing_measures(self, measures1, measures2, key, attr, other_filename):
        in_1_not_2 = [m for m in measures1 if m.__dict__[key] not in [m.__dict__[key] for m in measures2]]
        if in_1_not_2: print(f"{attr}.{key} in {self.filename} but not in {other_filename}:", "".join([str(x) for x in in_1_not_2]))
        in_2_not_1 = [m for m in measures2 if m.__dict__[key] not in [m.__dict__[key] for m in measures1]]
        if in_2_not_1: print(f"{attr}.{key} in {other_filename} but not in {self.filename}:", "".join([str(x) for x in in_2_not_1]))


    def __eq__(self, other):
        self.id_eq = self.id == other.id
        self.eligibility_options_eq = [e1 == e2 for e1,e2 in zip(self.eligibility_options, other.eligibility_options)]
        self.measure_id_eq = self.measure_id == other.measure_id
        self.performance_options_eq = [po1 == po2 for po1,po2 in zip(self.performance_options, other.performance_options)]
        return all(self.eligibility_options_eq + self.performance_options_eq + [self.id_eq, self.measure_id_eq])



class MeasureId:

    def __init__(self, measure_id):
        self.measure_id = measure_id

    def __str__(self):
        return self.measure_id
    
    def __eq__(self, other):
        return self.measure_id == other.measure_id



class EligibilityOption:

    def __init__(self):
        self.min_age = None
        self.procedure_codes = []
        self.additional_procedure_codes = []
        self.diagnosis_codes = []
        self.additional_diagnosis_codes = []
        self.max_age = None
        self.option_group = None
        self.sex_code = None

    def __str__(self):
        return f"""
                EligibilityOption:
                    minAge: {self.min_age}
                    maxAge: {self.max_age}
                    optionGroup: {self.option_group}
                    sexCode: {self.sex_code}
                    procedureCodes: {"".join(str(pc) for pc in self.procedure_codes)}
                    additionalProcedureCodes:  {", ".join(str(apc) for apc in self.additional_procedure_codes)}
                    diagnosisCodes:  {", ".join(str(dc) for dc in self.diagnosis_codes)}
                    additionalDiagnosisCodes:  {", ".join(str(adc) for adc in self.additional_diagnosis_codes)}
        """

    def __eq__(self, other):
        primitives_eq = self.min_age == other.min_age and self.max_age == other.max_age and self.option_group == other.option_group and self.sex_code == other.sex_code
        procedure_codes_eq = [pc1 == pc2 for pc1,pc2 in zip(self.procedure_codes, other.procedure_codes)]
        additional_procedure_codes_eq = [apc1 == apc2 for apc1,apc2 in zip(self.additional_procedure_codes, other.additional_procedure_codes)]
        diagnosis_codes_eq = self.diagnosis_codes == other.diagnosis_codes
        additional_diagnosis_codes_eq = self.additional_diagnosis_codes == other.additional_diagnosis_codes
        return all(procedure_codes_eq + additional_procedure_codes_eq + [primitives_eq, diagnosis_codes_eq, additional_diagnosis_codes_eq])






class ProcedureCode:

    def __init__(self):
        self.code = None
        self.modifier_exclusions = []
        self.places_of_service_exclusions = []

    def __str__(self):
        return f"""
                        Code: {self.code}
                        Modifier Exclusions: {", ".join([str(me) for me in self.modifier_exclusions])}
                        Places of Service Exclusions: {", ".join([str(pe) for pe in self.places_of_service_exclusions])}
        """

    def __eq__(self, other):
        code_eq = self.code == other.code
        modifier_exclusions_eq = self.modifier_exclusions == other.modifier_exclusions
        places_of_service_exclusions_eq = self.places_of_service_exclusions == other.places_of_service_exclusions
        return all([code_eq, modifier_exclusions_eq, places_of_service_exclusions_eq])

    def __lt__(self, other):
        return self.code < other.code



class PerformanceOption:

    def __init__(self):
        self.option_group = None
        self.option_type = None
        self.quality_codes = []

    def __str__(self):
        return f"""
                Option Group: {self.option_group}
                Option Type: {self.option_type}
                Quality Codes: {", ".join([str(qc) for qc in self.quality_codes])}
        """

    def __eq__(self, other):
        # print("self", self)
        # print(self.quality_codes[0].code)
        # print("other", other)
        option_group_eq = self.option_group == other.option_group
        option_type_eq = self.option_type == other.option_type 
        quality_codes_eq = [qc1 == qc2 for qc1,qc2 in zip(self.quality_codes, other.quality_codes)]
        return all( quality_codes_eq + [option_group_eq, option_type_eq])

    def __lt__(self, other):
        self.quality_codes[0].code < other.quality_codes[0].code 


class QualityCode:

    def __init__(self):
        self.code = None
        self.modifiers = []
        self.modifier_exclusions = []
        self.places_of_service_exclusions = []


    def __str__(self):
        return f"""
                    Code: {self.code}
                    Modifiers: {", ".join([str(m) for m in self.modifiers])}
                    Modifier Exclusions: {", ".join([str(me) for me in self.modifier_exclusions])}
                    Places of Service Exclusions: {", ".join([str(p) for p in self.places_of_service_exclusions])}"""

    def __eq__(self, other):
        code_eq = self.code == other.code
        modifiers_eq = self.modifiers == other.modifiers
        modifiers_exclusions_eq = self.modifier_exclusions == other.modifier_exclusions
        places_of_service_exclusions_eq = self.places_of_service_exclusions == other.places_of_service_exclusions
        return all([code_eq, modifiers_eq, modifiers_exclusions_eq, places_of_service_exclusions_eq])

    def __lt__(self, other):
        return self.code < other.code




if __name__ == "__main__":
    with open("sample.txt", "r") as f:
        txt = f.read()
    m = Measure(txt)