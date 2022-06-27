import re
from mixins import StringFormatterMixin


class Measure(StringFormatterMixin):
    def __init__(self, id, filename):
        self.id = id
        self.filename = filename
        self.eligibility_options = []
        self.measure_id = ""
        self.performance_options = []
        self.diff_list = []
        self.year = re.search(r"\d{4}", self.filename).group()

    def __str__(self):
        return f"""
        ID: {self.id}
            eligibilityOptions: {", ".join([str(eo) for eo in self.eligibility_options])}
            measureId: {self.measure_id}
            performanceOptions: { "".join([str(po) for po in self.performance_options ])}"""

    def __repr__(self):
        return f"Measure {self.id}"

    def compare(self, other):
        self.diff_list = self.diff_list = self.append_string(
            f"# DIFF REPORT FOR MEASURE {self.id} (comparing {self.filename} and {other.filename} )",
        )
        if not all(self.eligibility_options_eq):
            self.diff_list = self.diff_list = self.append_string(
                "## Eligibility Options Details\n"
            )
            self.get_eligibility_opt_diff(other)
        if not all(self.performance_options_eq):
            self.diff_list = self.append_string("## Performance Options Details\n")
            self.get_performance_opt_diff(other)

    def get_performance_opt_diff(self, other):
        common1 = [
            po1
            for po1 in self.performance_options
            if po1.quality_codes[0].code
            in [po2.quality_codes[0].code for po2 in other.performance_options]
        ]
        common2 = list(
            [
                po2
                for po2 in other.performance_options
                if po2.quality_codes[0].code
                in [po1.quality_codes[0].code for po1 in self.performance_options]
            ]
        )

        common_quality_codes = [po2.quality_codes[0].code for po2 in common1]
        self.diff_list = self.append_string(
            f"**There are {len(set(common_quality_codes))} common performance options for both {self.year} and {other.year}:**"
        )
        self.diff_list = self.append_string(
            f"\n{self.convert_list_to_bullets(sorted(list(set(common_quality_codes))))}",
            add_tab=True,
        )
        quality_codes_only_in_po1 = [
            x
            for x in [
                po2.quality_codes[0].code for po2 in sorted(self.performance_options)
            ]
            if x not in common_quality_codes
        ]
        quality_codes_only_in_po2 = [
            x
            for x in [
                po2.quality_codes[0].code for po2 in sorted(other.performance_options)
            ]
            if x not in common_quality_codes
        ]

        if len(quality_codes_only_in_po1):
            self.diff_list = self.append_string(
                f"**There are {len(quality_codes_only_in_po1)} performance options in {self.year} but not {other.year}:** \n{self.convert_list_to_bullets(quality_codes_only_in_po1)}"
            )
        if len(quality_codes_only_in_po2):
            self.diff_list = self.append_string(
                f"**There are {len(quality_codes_only_in_po2)} performance options in {self.year} but not {other.year}:** \n{self.convert_list_to_bullets(quality_codes_only_in_po2)}"
            )

        in_1_not_in_2 = [
            po1
            for po1 in self.performance_options
            if po1.quality_codes[0].code
            not in [comm.quality_codes[0].code for comm in common1]
        ]
        in_2_not_in_1 = [
            po2
            for po2 in other.performance_options
            if po2.quality_codes[0].code
            not in [comm.quality_codes[0].code for comm in common1]
        ]

        if in_1_not_in_2:
            self.diff_list = self.append_string(
                f"**Performance options detail in {self.year} not in {other.year}:**"
            )
            for missing in in_1_not_in_2:
                self.diff_list = self.append_string(str(missing), add_tab=True)
        if in_2_not_in_1:
            self.diff_list = self.append_string(
                f"**Performance options detail in {other.year} not in {self.year}:**"
            )
            for missing in in_2_not_in_1:
                self.diff_list = self.append_string(str(missing), add_tab=True)

        common_po_pairs = sorted([(po1, po2) for po1, po2 in zip(common1, common2)])
        self.diff_list = self.append_string(
            "**Common Performance option pairs that differ in detail:**"
        )
        for po1, po2 in common_po_pairs:
            should_print = any(
                [
                    True
                    for attr in po1.__dict__.keys()
                    if po1.__dict__[attr] != po2.__dict__[attr]
                ]
            )
            if should_print:
                self.diff_list = self.append_string(
                    f"{self.year} Performance Option: {po1}", add_tab=True
                )
                self.diff_list = self.append_string(
                    f"{other.year} Performance Option: {po2}", add_tab=True
                )
                self.diff_list = self.append_string("---")

    def get_eligibility_opt_diff(self, other):
        eo_pairs = [
            (eo1, eo2)
            for eo1, eo2 in zip(self.eligibility_options, other.eligibility_options)
        ]
        for eo1, eo2 in eo_pairs:
            for attr in eo1.__dict__.keys():
                if eo1.__dict__[attr] != eo2.__dict__[attr]:
                    if (
                        attr == "procedure_codes"
                        or attr == "additional_procedure_codes"
                    ):
                        key = "code"
                        self.get_missing_proc_codes(
                            eo1.__dict__[attr],
                            eo2.__dict__[attr],
                            key,
                            attr,
                            other.year,
                        )
                        common_measures = self.get_common_measures(
                            eo1.__dict__[attr], eo2.__dict__[attr], key
                        )
                        self.compare_common_pairs(common_measures, other.year, attr)
                    elif attr == "diagnosis_codes":
                        self.get_missing_diag_codes(
                            eo1.__dict__[attr], eo2.__dict__[attr], attr, other.year
                        )
                        self.append_string("\n", add_tab=True)
                    elif attr in ["option_group", "min_age"]:
                        self.handle_simple_eo_attribute(
                            attr, other.year, eo1.__dict__[attr], eo2.__dict__[attr]
                        )
                    else:
                        raise NotImplementedError(f"You need to account for {attr}")

    def handle_simple_eo_attribute(self, attr, other_year, eo1, eo2):
        self.diff_list = self.append_string(f"**Differing {attr} Pair:**")
        self.diff_list = self.append_string(
            f"{self.year} eligibilityOptions.{attr} = {eo1}", add_tab=True
        )
        self.diff_list = self.append_string(
            f"{other_year} eligibilityOptions.{attr} = {eo2}", add_tab=True
        )
        self.diff_list = self.append_string("\n", add_tab=True)

    def get_common_measures(self, measures1, measures2, key):
        if not measures1 and not measures2:
            return list(zip([], []))
        if not measures1:
            return list(zip([], measures2))
        if not measures2:
            return list(zip(measures1, []))
        common_measue1 = [
            m
            for m in measures1
            if m.__dict__[key] in [m.__dict__[key] for m in measures2]
        ]
        common_measure2 = [
            m
            for m in measures2
            if m.__dict__[key] in [m.__dict__[key] for m in measures1]
        ]
        return list(zip(common_measue1, common_measure2))

    def compare_common_pairs(self, common_measures, other_year, attr):
        for m1, m2 in common_measures:
            if m1 != m2:
                self.diff_list = self.append_string(
                    f"**Differing {attr} Pair for code {m1.code}:**"
                )
                self.diff_list = self.append_string(
                    f"{attr} from {self.year}: {m1}", add_tab=True
                )
                self.diff_list = self.append_string(
                    f"{attr} from {other_year}: {m2}", add_tab=True
                )

    def get_missing_diag_codes(self, measures1, measures2, attr, other_year):
        in_1_not_2 = [m.strip() for m in measures1 if m not in measures2]
        if in_1_not_2:
            self.diff_list = self.append_string(
                f"**{attr} in {self.year} but not {other_year}:** ",
                add_newline=False,
            )
            self.diff_list = self.append_string(
                self.convert_list_to_bullets(in_1_not_2)
            )
        in_2_not_1 = [m.strip() for m in measures2 if m not in measures1]
        if in_2_not_1:
            self.diff_list = self.append_string(
                f"**{attr} in {other_year} but not {self.year}:** ", add_newline=False
            )
            self.diff_list = self.append_string(
                self.convert_list_to_bullets(in_2_not_1)
            )

    def get_missing_proc_codes(self, measures1, measures2, key, attr, other_year):
        in_1_not_2 = [
            m
            for m in measures1
            if m.__dict__[key] not in [m.__dict__[key] for m in measures2]
        ]
        if in_1_not_2:
            self.diff_list = self.append_string(
                f"**{attr}.{key} in {self.year} but not {other_year}:**"
            )
            self.diff_list = self.append_string(
                "".join([str(x) for x in in_1_not_2]), add_tab=True
            )
        in_2_not_1 = [
            m
            for m in measures2
            if m.__dict__[key] not in [m.__dict__[key] for m in measures1]
        ]
        if in_2_not_1:
            self.diff_list = self.append_string(
                f"**{attr}.{key} in {other_year} but not {self.year}:**"
            )
            self.diff_list = self.append_string(
                "".join([str(x) for x in in_2_not_1]), add_tab=True
            )

    def __eq__(self, other):
        self.id_eq = self.id == other.id
        self.eligibility_options_eq = [
            e1 == e2
            for e1, e2 in zip(self.eligibility_options, other.eligibility_options)
        ]
        self.measure_id_eq = self.measure_id == other.measure_id
        self.performance_options_eq = [
            po1 == po2
            for po1, po2 in zip(self.performance_options, other.performance_options)
        ]
        return all(
            self.eligibility_options_eq
            + self.performance_options_eq
            + [self.id_eq, self.measure_id_eq]
        )


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
            additionalDiagnosisCodes:  {", ".join(str(adc) for adc in self.additional_diagnosis_codes)}"""

    def __eq__(self, other):
        primitives_eq = (
            self.min_age == other.min_age
            and self.max_age == other.max_age
            and self.option_group == other.option_group
            and self.sex_code == other.sex_code
        )
        procedure_codes_eq = [
            pc1 == pc2 for pc1, pc2 in zip(self.procedure_codes, other.procedure_codes)
        ]
        additional_procedure_codes_eq = [
            apc1 == apc2
            for apc1, apc2 in zip(
                self.additional_procedure_codes, other.additional_procedure_codes
            )
        ]
        diagnosis_codes_eq = self.diagnosis_codes == other.diagnosis_codes
        additional_diagnosis_codes_eq = (
            self.additional_diagnosis_codes == other.additional_diagnosis_codes
        )
        return all(
            procedure_codes_eq
            + additional_procedure_codes_eq
            + [primitives_eq, diagnosis_codes_eq, additional_diagnosis_codes_eq]
        )


class ProcedureCode:
    def __init__(self):
        self.code = ""
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
        places_of_service_exclusions_eq = (
            self.places_of_service_exclusions == other.places_of_service_exclusions
        )
        return all([code_eq, modifier_exclusions_eq, places_of_service_exclusions_eq])

    def __lt__(self, other):
        return self.code < other.code


class PerformanceOption:
    def __init__(self):
        self.option_group = ""
        self.option_type = ""
        self.quality_codes = []

    def __str__(self):
        return f"""
        Option Group: {self.option_group}
        Option Type: {self.option_type}
        Quality Codes: {"".join([str(qc) for qc in self.quality_codes])}"""

    def __eq__(self, other):
        option_group_eq = self.option_group == other.option_group
        option_type_eq = self.option_type == other.option_type
        quality_codes_eq = [
            qc1 == qc2 for qc1, qc2 in zip(self.quality_codes, other.quality_codes)
        ]
        return all(quality_codes_eq + [option_group_eq, option_type_eq])

    def __lt__(self, other):
        return self.quality_codes[0].code < other.quality_codes[0].code


class QualityCode:
    def __init__(self):
        self.code = ""
        self.modifiers = []
        self.modifier_exclusions = []
        self.places_of_service_exclusions = []

    def __str__(self):
        return f"""
            Code: {self.code}
            Modifiers: {", ".join([str(m) for m in self.modifiers])}
            Modifier Exclusions: {", ".join([str(me) for me in self.modifier_exclusions])}
            Places of Service Exclusions: {", ".join([str(p) for p in self.places_of_service_exclusions])}
        """

    def __eq__(self, other):
        code_eq = self.code == other.code
        modifiers_eq = self.modifiers == other.modifiers
        modifiers_exclusions_eq = self.modifier_exclusions == other.modifier_exclusions
        places_of_service_exclusions_eq = (
            self.places_of_service_exclusions == other.places_of_service_exclusions
        )
        return all(
            [
                code_eq,
                modifiers_eq,
                modifiers_exclusions_eq,
                places_of_service_exclusions_eq,
            ]
        )

    def __lt__(self, other):
        return self.code < other.code
