const marked_frames = new Map([
  [
    105,
    {
      player1PositivePoints: [
        {
          x: 332.5,
          y: 347.453125,
        },
        {
          x: 339.5,
          y: 387.453125,
        },
      ],
      player1NegativePoints: [],
      player2PositivePoints: [
        {
          x: 602.5,
          y: 385.453125,
        },
        {
          x: 604.5,
          y: 422.453125,
        },
      ],
      player2NegativePoints: [],
    },
  ],
  [
    4615,
    {
      player1PositivePoints: [
        {
          x: 378.5,
          y: 376.453125,
        },
        {
          x: 387.5,
          y: 434.453125,
        },
      ],
      player1NegativePoints: [],
      player2PositivePoints: [
        {
          x: 629.5,
          y: 342.453125,
        },
        {
          x: 627.5,
          y: 368.453125,
        },
      ],
      player2NegativePoints: [],
    },
  ],
  [
    7930,
    {
      player1PositivePoints: [
        {
          x: 346.5,
          y: 348.453125,
        },
        {
          x: 334.5,
          y: 371.453125,
        },
      ],
      player1NegativePoints: [],
      player2PositivePoints: [
        {
          x: 607.5,
          y: 370.453125,
        },
        {
          x: 610.5,
          y: 406.453125,
        },
      ],
      player2NegativePoints: [],
    },
  ],
  [
    11045,
    {
      player1PositivePoints: [
        {
          x: 656.5,
          y: 343.453125,
        },
        {
          x: 659.5,
          y: 373.453125,
        },
      ],
      player1NegativePoints: [],
      player2PositivePoints: [
        {
          x: 419.5,
          y: 371.453125,
        },
        {
          x: 414.5,
          y: 398.453125,
        },
      ],
      player2NegativePoints: [],
    },
  ],
]);
const chunks = [
  [
    [105, 970],
    [1410, 1580],
    [1755, 2040],
    [2225, 2410],
    [2575, 3565],
  ],
  [
    [3566, 4365],
    [4615, 4810],
    [4990, 6455],
    [6700, 6737],
  ],
  [
    [6738, 7645],
    [7930, 8770],
    [8985, 9545],
    [9790, 9979],
  ],
  [
    [9980, 10745],
    [11045, 11920],
    [12335, 12465],
    [12725, 13330],
  ],
];

const key_to_chunk_idx = (key, chunks) => {
  for (let i = 0; i < chunks.length; i++) {
    for (const [start, end] of chunks[i]) {
      if (start <= key && key <= end) {
        return i;
      }
    }
  }
};

const convertMarkedFramesToMarkerInput = (marked_frames, chunks) => {
  let chunk_validate = Array(chunks.length).fill([false, false]);
  let result = { marker_input: Array(chunks.length).fill([]) };

  marked_frames.forEach((value, key) => {
    let chunk_idx = key_to_chunk_idx(key, chunks);
    let player1_marker = {
      frame_idx: key,
      player_id: 1,
      points: [
        ...value.player1PositivePoints.map((point) => {
          chunk_validate[chunk_idx][0] = true;
          return [point.x, point.y];
        }),
        ...value.player1NegativePoints.map((point) => {
          return [point.x, point.y];
        }),
      ],
      labels: [
        [...Array(value.player1PositivePoints.length).fill(1), ...Array(value.player1NegativePoints.length).fill(0)],
      ],
    };
    let player2_marker = {
      frame_idx: key,
      player_id: 2,
      points: [
        ...value.player2PositivePoints.map((point) => {
          chunk_validate[chunk_idx][1] = true;
          return [point.x, point.y];
        }),
        ...value.player2NegativePoints.map((point) => {
          return [point.x, point.y];
        }),
      ],
      labels: [
        [...Array(value.player2PositivePoints.length).fill(1), ...Array(value.player2NegativePoints.length).fill(0)],
      ],
    };
    result.marker_input[chunk_idx].push(player1_marker, player2_marker);
  });

  const isValidMarkerInput = chunk_validate.every((chunk) => chunk.every((valid) => valid));
  return { result, isValidMarkerInput };
};

const result = convertMarkedFramesToMarkerInput(marked_frames, chunks);
console.log(result);
