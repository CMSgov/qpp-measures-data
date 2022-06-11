import json
import copy

# qpp-single-source-2021.json
# sample.json
with open("qpp-single-source-2021.json") as f:
    data = json.load(f)

def is_primitive(item):
    return type(item) in [str, int, bool, float]

def is_list(item):
    return type(item) is list

def is_obj(item):
    return type(item) is dict


def display(data, depth=0, parent_type=None):
    if is_list(data):
        pad = "-" * depth
        return  "".join([display(d, depth + 1, list) for d in data]) 
    elif is_obj(data):
        pad = "-" * depth
        return  "".join([f"\n{pad}{k}: {display(v, depth + 1, dict)}" for k,v in data.items()]) 
    elif is_primitive(data):
        pad = "-" * depth
        if parent_type is list:
            return f"\n{pad}" + str(data) 
        return str(data) 

# print(display(data))
with open("res.txt", "w") as f:
    f.write(display(data))