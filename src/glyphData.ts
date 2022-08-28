export enum PathSeg {
  Move,
  Line,
  Quad, // quadratic bezier
  Close,
}

export type PathSegmentDef =
  | [PathSeg.Move, number, number]
  | [PathSeg.Line, number, number]
  | [PathSeg.Quad, number, number, number, number]
  | [PathSeg.Close];

export const glyphA: PathSegmentDef[] = [
  [PathSeg.Move, 0.14697265625, -0.14501953125],
  [PathSeg.Quad, 0.14697265625, -0.09814453125, 0.16650390625, -0.07470703125],
  [PathSeg.Quad, 0.1865234375, -0.0517578125, 0.22802734375, -0.0517578125],
  [PathSeg.Quad, 0.25830078125, -0.0517578125, 0.28271484375, -0.0615234375],
  [PathSeg.Quad, 0.3076171875, -0.0712890625, 0.32470703125, -0.08935546875],
  [PathSeg.Quad, 0.34228515625, -0.107421875, 0.3515625, -0.13330078125],
  [PathSeg.Quad, 0.36083984375, -0.1591796875, 0.36083984375, -0.19091796875],
  [PathSeg.Line, 0.36083984375, -0.27197265625],
  [PathSeg.Line, 0.296875, -0.26904296875],
  [PathSeg.Quad, 0.25439453125, -0.26708984375, 0.2255859375, -0.25830078125],
  [PathSeg.Quad, 0.197265625, -0.25, 0.1796875, -0.234375],
  [PathSeg.Quad, 0.162109375, -0.21923828125, 0.154296875, -0.19677734375],
  [PathSeg.Quad, 0.14697265625, -0.17431640625, 0.14697265625, -0.14501953125],
  [PathSeg.Close],
  [PathSeg.Move, 0.26806640625, -0.49609375],
  [PathSeg.Quad, 0.2392578125, -0.49609375, 0.22119140625, -0.48779296875],
  [PathSeg.Quad, 0.20361328125, -0.47998046875, 0.193359375, -0.46533203125],
  [PathSeg.Quad, 0.18359375, -0.45068359375, 0.18017578125, -0.4306640625],
  [PathSeg.Quad, 0.1767578125, -0.41064453125, 0.1767578125, -0.38720703125],
  [PathSeg.Quad, 0.13525390625, -0.38720703125, 0.11328125, -0.4013671875],
  [PathSeg.Quad, 0.091796875, -0.41552734375, 0.091796875, -0.4501953125],
  [PathSeg.Quad, 0.091796875, -0.47607421875, 0.10595703125, -0.494140625],
  [PathSeg.Quad, 0.1201171875, -0.51220703125, 0.14453125, -0.5234375],
  [PathSeg.Quad, 0.16943359375, -0.53515625, 0.2021484375, -0.54052734375],
  [PathSeg.Quad, 0.23486328125, -0.5458984375, 0.27197265625, -0.5458984375],
  [PathSeg.Quad, 0.31787109375, -0.5458984375, 0.35205078125, -0.53662109375],
  [PathSeg.Quad, 0.38623046875, -0.52783203125, 0.4091796875, -0.50732421875],
  [PathSeg.Quad, 0.43212890625, -0.48681640625, 0.443359375, -0.45361328125],
  [PathSeg.Quad, 0.455078125, -0.4208984375, 0.455078125, -0.373046875],
  [PathSeg.Line, 0.455078125, -0.11376953125],
  [PathSeg.Quad, 0.455078125, -0.0927734375, 0.45849609375, -0.0791015625],
  [PathSeg.Quad, 0.4619140625, -0.0654296875, 0.46923828125, -0.05712890625],
  [PathSeg.Quad, 0.4765625, -0.048828125, 0.48828125, -0.04541015625],
  [PathSeg.Quad, 0.50048828125, -0.0419921875, 0.51708984375, -0.0419921875],
  [PathSeg.Line, 0.52001953125, -0.0419921875],
  [PathSeg.Line, 0.52001953125, 0],
  [PathSeg.Line, 0.384765625, 0],
  [PathSeg.Line, 0.369140625, -0.0859375],
  [PathSeg.Line, 0.36083984375, -0.0859375],
  [PathSeg.Quad, 0.34521484375, -0.06494140625, 0.33056640625, -0.04736328125],
  [PathSeg.Quad, 0.31591796875, -0.02978515625, 0.29833984375, -0.01708984375],
  [PathSeg.Quad, 0.28076171875, -0.00439453125, 0.25830078125, 0.00244140625],
  [PathSeg.Quad, 0.236328125, 0.009765625, 0.205078125, 0.009765625],
  [PathSeg.Quad, 0.171875, 0.009765625, 0.14306640625, 0],
  [PathSeg.Quad, 0.11474609375, -0.00927734375, 0.09375, -0.02880859375],
  [PathSeg.Quad, 0.0732421875, -0.048828125, 0.0615234375, -0.07861328125],
  [PathSeg.Quad, 0.0498046875, -0.10888671875, 0.0498046875, -0.14990234375],
  [PathSeg.Quad, 0.0498046875, -0.2294921875, 0.1064453125, -0.26806640625],
  [PathSeg.Quad, 0.1630859375, -0.306640625, 0.27783203125, -0.31005859375],
  [PathSeg.Line, 0.36083984375, -0.31298828125],
  [PathSeg.Line, 0.36083984375, -0.373046875],
  [PathSeg.Quad, 0.36083984375, -0.39990234375, 0.35791015625, -0.42236328125],
  [PathSeg.Quad, 0.35498046875, -0.4453125, 0.34521484375, -0.46142578125],
  [PathSeg.Quad, 0.33544921875, -0.47802734375, 0.31689453125, -0.48681640625],
  [PathSeg.Quad, 0.298828125, -0.49609375, 0.26806640625, -0.49609375],
  [PathSeg.Close],
];

export const glyphE: PathSegmentDef[] = [
  [PathSeg.Move, 0.27490234375, -0.4921875],
  [PathSeg.Quad, 0.21923828125, -0.4921875, 0.18896484375, -0.44677734375],
  [PathSeg.Quad, 0.1591796875, -0.40185546875, 0.15380859375, -0.31494140625],
  [PathSeg.Line, 0.3837890625, -0.31494140625],
  [PathSeg.Quad, 0.3837890625, -0.3544921875, 0.3779296875, -0.38720703125],
  [PathSeg.Quad, 0.3720703125, -0.419921875, 0.359375, -0.443359375],
  [PathSeg.Quad, 0.3466796875, -0.466796875, 0.32568359375, -0.4794921875],
  [PathSeg.Quad, 0.30517578125, -0.4921875, 0.27490234375, -0.4921875],
  [PathSeg.Close],
  [PathSeg.Move, 0.287109375, 0.009765625],
  [PathSeg.Quad, 0.23291015625, 0.009765625, 0.189453125, -0.00830078125],
  [PathSeg.Quad, 0.146484375, -0.02685546875, 0.11669921875, -0.06201171875],
  [PathSeg.Quad, 0.0869140625, -0.09716796875, 0.07080078125, -0.14794921875],
  [PathSeg.Quad, 0.05517578125, -0.19921875, 0.05517578125, -0.26416015625],
  [PathSeg.Quad, 0.05517578125, -0.404296875, 0.11279296875, -0.47509765625],
  [PathSeg.Quad, 0.17041015625, -0.5458984375, 0.27685546875, -0.5458984375],
  [PathSeg.Quad, 0.3251953125, -0.5458984375, 0.36376953125, -0.53076171875],
  [PathSeg.Quad, 0.40234375, -0.515625, 0.42919921875, -0.4853515625],
  [PathSeg.Quad, 0.4560546875, -0.45556640625, 0.47021484375, -0.41064453125],
  [PathSeg.Quad, 0.48486328125, -0.3662109375, 0.48486328125, -0.30712890625],
  [PathSeg.Line, 0.48486328125, -0.26123046875],
  [PathSeg.Line, 0.15185546875, -0.26123046875],
  [PathSeg.Quad, 0.15283203125, -0.20654296875, 0.16259765625, -0.1669921875],
  [PathSeg.Quad, 0.1728515625, -0.1279296875, 0.19140625, -0.1025390625],
  [PathSeg.Quad, 0.21044921875, -0.0771484375, 0.23779296875, -0.06494140625],
  [PathSeg.Quad, 0.26513671875, -0.05322265625, 0.30078125, -0.05322265625],
  [PathSeg.Quad, 0.32666015625, -0.05322265625, 0.3486328125, -0.05908203125],
  [PathSeg.Quad, 0.37109375, -0.06494140625, 0.38916015625, -0.07470703125],
  [PathSeg.Quad, 0.4072265625, -0.08447265625, 0.4208984375, -0.0966796875],
  [PathSeg.Quad, 0.43505859375, -0.109375, 0.44384765625, -0.123046875],
  [PathSeg.Quad, 0.45068359375, -0.1201171875, 0.45654296875, -0.11083984375],
  [PathSeg.Quad, 0.462890625, -0.1015625, 0.462890625, -0.0888671875],
  [PathSeg.Quad, 0.462890625, -0.07373046875, 0.4521484375, -0.05615234375],
  [PathSeg.Quad, 0.44140625, -0.0390625, 0.41943359375, -0.0244140625],
  [PathSeg.Quad, 0.3974609375, -0.009765625, 0.3642578125, 0],
  [PathSeg.Quad, 0.33154296875, 0.009765625, 0.287109375, 0.009765625],
  [PathSeg.Close],
];

export const glyphTriangle = [
  [PathSeg.Move, -0.5, -0.5],
  [PathSeg.Line, 0.5, -0.5],
  [PathSeg.Line, 0.0, 0.5],
  [PathSeg.Close],
];