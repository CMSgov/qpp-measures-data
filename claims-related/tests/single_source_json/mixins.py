from copy import deepcopy


class StringFormatterMixin:
    def append_string(self, str, add_tab=False, add_newline=True):
        tabbing = "\t" if add_tab else ""
        newline = "\n" if add_newline else ""
        diff_list_copy = deepcopy(self.diff_list)
        return diff_list_copy + [tabbing + str + newline]

    @staticmethod
    def convert_list_to_bullets(lst):
        return "\n".join(["* " + str(x) for x in lst])
