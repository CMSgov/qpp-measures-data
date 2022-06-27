import glob
import pandas as pd
import sys
import os

# Change these files wherenver needed

basefilename = "../../data/2020_Claims_SingleSource_v1.4.csv"
newfilename = "../../data/2021_Claims_SingleSource_v1.3.csv"

basefile = pd.read_csv(basefilename, dtype=str)
newfile = pd.read_csv(newfilename, dtype=str)

basefile.columns = basefile.columns.str.replace(' ', '_')
newfile.columns = newfile.columns.str.replace(' ', '_')
# Version to capture
basefile["VERSION"] = "BASE"
newfile["VERSION"] = "NEW"
# Const to capture the whole file
basefile["CONST"] = "CONST"
newfile["CONST"] = "CONST"

key = newfile.columns.values.tolist()
key.remove("VERSION")
joint = newfile.merge(basefile, on=key, how="outer", suffixes=["_new", "_base"])


def getJoinMeta(row):
    val = "NONE"
    if (row["VERSION_new"] == "NEW") & (row["VERSION_base"] == "BASE"):
        val = "COMMON"
    elif row["VERSION_new"] == "NEW":
        val = "NEW"
    else:
        val = "BASE"
    return val


joint["VERSION"] = joint.apply(getJoinMeta, axis=1)
joint = joint.drop(["VERSION_new", "VERSION_base"], axis=1)

print("Checking if join is successful ( expected output none)")
joint[joint.VERSION == "NONE"]

onlybase = joint[joint.VERSION == "BASE"]
print("Base rows only")
print(len(onlybase))
print("new rows only")
onlynew = joint[joint.VERSION == "NEW"]
print(len(onlynew))
print("coommon rows only")
intersection = joint[joint.VERSION == "COMMON"]
print(len(intersection))


def columnToSet(df, column: str):
    return set(df[column].unique().tolist())


def analyze_difference(joint, partcolumn, partid, subcol, debug=False):
    subset = joint[joint[partcolumn] == partid]
    basedf = subset[(subset.VERSION == "BASE") | (subset.VERSION == "COMMON")]
    newdf = subset[(subset.VERSION == "NEW") | (subset.VERSION == "COMMON")]

    newids = columnToSet(newdf, subcol)
    baseids = columnToSet(basedf, subcol)

    added = newids - baseids
    removed = baseids - newids

    # get all the changed IDs
    changedids = columnToSet(subset[subset.VERSION != "COMMON"], subcol)

    changed = changedids - added - removed

    if debug == True:
        print("Added")
        print(added)
        print("Removed")
        print(removed)
        print("Changed")
        print(changed)

    return (subset, added | removed | changed, added, removed, changed)


# Main function
os.makedirs("csv_report", exist_ok=True)
(df, modified_mid, added_mid, removed_mid, changed_mid) = analyze_difference(joint, "CONST", "CONST", "Measure_ID")

mid = {}

modified_den = {}
added_den = {}
changed_den = {}
removed_den = {}

with open("csv_report/Summary.md", "a") as f:
    print("# Single Source changes Summary", file=f)
    print("Basefile = " + basefilename)
    print("newfile =" + newfilename)
    print("*Added Measures*:" + str(added_mid), file=f)
    print("*Removed Measures*:" + str(removed_mid), file=f)
    print("*Changed Measures*:" + str(changed_mid), file=f)
import sys

report_mid = modified_mid

if (len(sys.argv) > 1):
    if sys.argv[1] in modified_mid:
        report_mid = {sys.argv[1]}
    else:
        print("The supplied measure is not modified")
        report_mid = {}

for i in report_mid:
    filename = "csv_report/Measure" + i + ".md"
    files = glob.glob(filename)
    for f in files:
        os.remove(f)
    with open(filename, "a") as f:
        print("# Comparison for Measure ID " + i + "= ", file=f)
        (mid[i], modified_den[i], added_den[i], removed_den[i], changed_den[i]) = analyze_difference(df, "Measure_ID",
                                                                                                     i,
                                                                                                     "DATA_ELEMENT_NAME",
                                                                                                     False)
        den = {}
        modified_code = {}
        added_code = {}
        removed_code = {}
        changed_code = {}

        print("Data Element Name Summary", file=f)
        print("*Added DEN*:" + str(added_den[i]), file=f)
        print("*Removed DEN*:" + str(removed_den[i]), file=f)
        print("*Changed DEN*:" + str(changed_den[i]), file=f)

        for j in added_den[i]:
            print("## For ADDED Data Element name " + j, file=f)
            (den[j], modified_code[j], added_code[j], removed_code[j], changed_code[j]) = analyze_difference(mid[i], "DATA_ELEMENT_NAME",j, "CODE")
            print("Codes Summary", file=f)
            print("*Number of CODES*:" + str(len(added_code[j])), file=f)

            print("### Codes added as part of Data Element", file=f)
            print(den[j][den[j]["CODE"].isin(added_code[j])].to_markdown(tablefmt="grid"), file=f)


        for j in removed_den[i]:
            print("## For REMOVED Data Element name " + j, file=f)
            (den[j], modified_code[j], added_code[j], removed_code[j], changed_code[j]) = analyze_difference(mid[i],
                                                                                                             "DATA_ELEMENT_NAME",
                                                                                                             j, "CODE")
            print("Codes Summary", file=f)
            print("* Number of CODES*:" + str(len(removed_code[j])), file=f)

            print("### Codes REMOVED as part of Data Element", file=f)
            print(den[j][den[j]["CODE"].isin(removed_code[j])].to_markdown(tablefmt="grid"), file=f)


        for j in changed_den[i]:

            print("## For Data Element name " + j, file=f)
            (den[j], modified_code[j], added_code[j], removed_code[j], changed_code[j]) = analyze_difference(mid[i],
                                                                                                         "DATA_ELEMENT_NAME",
                                                                                                         j, "CODE")

            print("Codes Summary", file=f)
            print("* Number of Added CODES*:" + str(len(added_code[j])), file=f)
            print("* Number of Removed CODES*:" + str(len(removed_code[j])), file=f)
            print("* Number of Changed CODES*:" + str(len(changed_code[j])), file=f)

            if (len(added_code[j]) > 0):
                print("### Added Codes", file=f)
                print(den[j][den[j]["CODE"].isin(added_code[j])].to_markdown(tablefmt="grid"), file=f)
            if (len(removed_code[j]) > 0):
                print("### removed Codes", file=f)
                print(den[j][den[j]["CODE"].isin(removed_code[j])].to_markdown(tablefmt="grid"), file=f)
            if (len(changed_code[j]) > 0):
                print("### modified Codes", file=f)
                print(den[j][den[j]["CODE"].isin(modified_code[j])].to_markdown(tablefmt="grid"), file=f)

