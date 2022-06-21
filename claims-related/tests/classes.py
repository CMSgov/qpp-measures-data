import re
from itertools import takewhile

class Measure:

    def __init__(self, str_repr):
        self.parse_str_repr(str_repr)
        self.measure_id = None
        self.eligibility_options = None
        self.performance_options = None

    def parse_str_repr(self, str_repr):
        # print(str_repr)
        elig_opts_raw = takewhile( lambda x: not x.startswith("-measureId:"), str_repr.split("\n")[2:])
        elig_opts_raw_list = list(elig_opts_raw)
        # print(elig_opts_raw_list)
        elig_opts = EligibilityOptions(elig_opts_raw_list)
        print(elig_opts)



class MeasureId:

    def __init__(self, measure_id):
        self.measure_id = measure_id



class EligibilityOptions:

    # def __init__(
    #     self, 
    #     min_age, 
    #     procedure_codes, 
    #     additional_procedure_codes=None,
    #     diagnosis_codes=None, 
    #     additional_diagnosis_codes=None,
    #     max_age=None, 
    #     option_group=None, 
    #     sex_code=None
    #     ):
    #     self.min_age = min_age
    #     self.procedure_codes = sorted(procedure_codes)
    #     self.additional_procedure_codes = sorted(additional_procedure_codes) if additional_procedure_codes else None
    #     self.diagnosis_codes = sorted(diagnosis_codes) if diagnosis_codes else None
    #     self.additional_diagnosis_codes = sorted(additional_diagnosis_codes) if diagnosis_codes else None
    #     self.max_age = max_age
    #     self.option_group = option_group
    #     self.sex_code = sex_code


    def __init__(self, raw_args):
        self.min_age = None
        self.procedure_codes = None
        self.additional_procedure_codes = None
        self.diagnosis_codes = None
        self.additional_diagnosis_codes = None
        self.max_age = None
        self.option_group = None
        self.sex_code = None
        self.apply(raw_args)

    def __str__(self):
        return f"""EligibilityOptions:
        -min_age: {self.min_age}
        -max_age: {self.max_age}
        -option_group" {self.option_group}
        -sex_code: {self.sex_code}
        -procedure_codes: {self.procedure_codes}
        -additional_procedure_codes: {self.additional_procedure_codes}
        -diagnosis_codes: {self.diagnosis_codes}
        -additional_diagnosis_codes: {self.additional_diagnosis_codes}
        """

    def apply(self, raw_args):
        raw_args = self.get_simple_args(raw_args)
        self.get_complex_args(raw_args)

    
    @staticmethod
    def get_simple_value(regex, raw_args):
        value = [a.split(": ")[1] for a in raw_args if re.search(regex, a)]
        value = value[0] if value else None
        raw_args = [a for a in raw_args if not re.search(regex, a)]
        return value, raw_args


    def get_simple_args(self, raw_args):
        self.min_age, raw_args = self.get_simple_value(r"(minAge: )(.*)", raw_args)
        self.max_age, raw_args = self.get_simple_value(r"(maxAge: )(.*)", raw_args)
        self.option_group, raw_args = self.get_simple_value(r"(optionGroup: )(.*)", raw_args)
        return raw_args

    """
    Order Should be:
    1. diagnosisCodes
    2. procedureCodes
    """
    def get_complex_args(self, raw_args):
        print("in get_complex_args")
        diagnosis_codes_present = len([a for a in raw_args if re.search(r"diagnosisCodes:", a)]) > 0
        if diagnosis_codes_present:
            print("diag codes present")
            raw_args = [a for a in raw_args if not re.search(r"diagnosisCodes:", a)]
            # print(raw_args)
            raw_diagnosis_codes = list(takewhile(lambda x: re.search(r"([A-Z0-9]{3}\.\d{4})", x), raw_args))
            # print(raw_diagnosis_codes)
            raw_diagnosis_codes_list = [a.split("-")[-1] for a in raw_diagnosis_codes if re.search(r"([A-Z0-9]{3}\.\d{4})", a)]
            # print(raw_diagnosis_codes_list)
            sorted_diagnosis_codes_list = sorted(raw_diagnosis_codes_list)
            self.diagnosis_codes = sorted_diagnosis_codes_list
            raw_args = [a for a in raw_args if not re.search(r"([A-Z0-9]{3}\.\d{4})", a)]

        procedure_codes_present = len([a for a in raw_args if re.search(r"procedureCodes:", a)]) > 0
        if procedure_codes_present:
            raw_args = [a for a in raw_args if not re.search(r"procedureCodes:", a)]
            # print(raw_args)
            raw_codes = list(takewhile(lambda x: not re.search(r"measureId:", x), raw_args))
            # # print(raw_codes)
            # codes_list = [a.split(": ")[1] for a in raw_codes if re.search(r"(code: )(.*)", a)]
            # sorted_codes_list = sorted(codes_list)
            # self.procedure_codes = sorted_codes_list
            # raw_args = [a for a in raw_args if not re.search(r"(code: )(.*)", a)]
            self.procedure_codes = [ProcedureCode(x) for x in ...]
        print(raw_args)
   




    def __eq__(self, other):
        return self.min_age == other.min_age and self.procedure_codes == other.procedure_codes and self.diagnosis_codes == other.diagnosis_codes and self.max_age == other.max_age and self.option_group == other.option_group
    


class ProcedureCode:

    def __init__(self, raw_proc_code):
        self.code = None
        self.modifier_exclusions = None
        self.places_of_service_exclusions = None
        self.apply(raw_proc_code)
    
    def apply(self, raw_proc_code):
        pass

 






class PerformanceOptions:
    
    def __init__(self, options_list):
        self.options_list = options_list



class PerformanceOption:

    def __init__(self, option_group, option_type, quality_codes):
        self.option_group = option_group
        self.option_type = option_type
        self.quality_codes = sorted(quality_codes)

    def __eq__(self, other):
        return self.option_type == other.option_type 


class QualityCode:

    def __init__(self, code, option_group=None, modifier=None, modifier_exclusions=None):
        self.code = code
        self.option_group = option_group
        self.modifier = modifier
        self.modifier_exclusions = sorted(modifier_exclusions) if modifier_exclusions else None
        # self.places_of_service_exclusions = places_of_service_exclusions

    def __eq__(self, other):
        self.quality_code == other.quality_code and self.option_group == other.option_group and self.modifier == other.modifier

    def __lt__(self, other):
        pass



if __name__ == "__main__":
    with open("sample.txt", "r") as f:
        txt = f.read()
    m = Measure(txt)