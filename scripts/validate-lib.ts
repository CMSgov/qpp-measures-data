import Ajv, {
  AnySchemaObject,
  MissingRefError,
  SchemaCxt
} from 'ajv';
import ajvKeywords from 'ajv-keywords';
import jsonPatch from 'fast-json-patch';
import jsonMergePatch from 'json-merge-patch';
import * as URI from 'toad-uri-js';

const ajv = new Ajv({ verbose: true });
ajvKeywords(ajv, 'uniqueItemProperties');

/**
 * Implementations for `$merge` and `$patch` are adapted from the `ajv-merge-patch` package:
 * https://github.com/ajv-validator/ajv-merge-patch/tree/master
 * Due to a security vulnerability in the original package, we've integrated these functionalities directly.
 */
function addKeyword(ajv: Ajv, keyword: string, jsonPatch: any, patchSchema: { type: string, items?: any }) {
  ajv.addKeyword({
    keyword: keyword,
    macro: function (schema: AnySchemaObject, parentSchema: AnySchemaObject, it: SchemaCxt) {
      let source = schema.source;
      let patch = schema.with;
      if (source.$ref) source = JSON.parse(JSON.stringify(getSchema(source.$ref, it)));
      if (patch.$ref) patch = getSchema(patch.$ref, it);
      jsonPatch.call(null, source, patch, true);
      return source;

      function getSchema($ref: string, it: SchemaCxt) {
        const id = it.baseId && it.baseId !== '#' ? URI.resolve(it.baseId, $ref) : $ref;
        const validate = ajv.getSchema(id);
        if (validate) return validate.schema;
        throw new MissingRefError(URI, it.baseId, $ref);
      }
    },
    metaSchema: {
      type: "object",
      required: ["source", "with"],
      additionalProperties: false,
      properties: {
        source: {
          anyOf: [
            {
              type: "object",
              required: ["$ref"],
              additionalProperties: false,
              properties: { "$ref": { "type": "string", "format": "uri" } }
            },
            { $ref: "http://json-schema.org/draft-07/schema#" }
          ]
        },
        with: patchSchema
      }
    }
  });
}

// Adapted for $merge
addKeyword(ajv, '$merge', jsonMergePatch.apply, { type: "object" });

// Adapted for $patch
addKeyword(ajv, '$patch', jsonPatch.applyPatch, {
  type: "array",
  items: {
    type: "object",
    required: ["op", "path"],
    properties: {
      op: { type: "string" },
      path: { type: "string", format: "json-pointer" }
    },
    anyOf: [
      {
        properties: { op: { enum: ["add", "replace", "test"] } },
        required: ["value"]
      },
      {
        properties: { op: { enum: ["remove"] } }
      },
      {
        properties: {
          op: { enum: ["move", "copy"] },
          from: { type: "string", format: "json-pointer" }
        },
        required: ["from"]
      }
    ]
  }
});

export const ValidateLib = {
  validate: function (schema: AnySchemaObject, data: any) {
    const valid = ajv.validate(schema, data);

    return {
      valid,
      // Summary of errors, this is a string. If valid this is "No errors"
      errors: ajv.errorsText(ajv.errors),
      // Full error details, this is an array of objects
      details: ajv.errors
    };
  }
};
