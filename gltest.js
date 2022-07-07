const VERTEX_SHADER = `
precision mediump float;

attribute vec2 vertPosition;
attribute vec3 vertColor;
uniform float time;
varying vec3 fragColor;

void main() {
  fragColor = vec3(
    vertColor.r * ((sin(time) + 1.0) * 0.5),
    vertColor.g * ((cos(time * 0.6) + 1.0) * 0.5),
    vertColor.b * ((sin(time * 1.2) + 1.0) * 0.5)
  );
  gl_Position = vec4(vertPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

varying vec3 fragColor;

void main() {
  gl_FragColor = vec4(fragColor, 1.0);
}
`;

function compileShader(gl, shaderText, shaderType) {
  let shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderText);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[shader] compilation error.', gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function createProgram(gl, vertexShaderText, fragmentShaderText) {
  let vertexShader = compileShader(gl, vertexShaderText, gl.VERTEX_SHADER);
  let fragmentShader = compileShader(gl, fragmentShaderText, gl.FRAGMENT_SHADER);

  if (vertexShader === null || fragmentShader === null) {
    return null;
  }

  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('[program] linking error.', gl.getProgramInfoLog(program));
    return null;
  }

  gl.validateProgram(program);

  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error('[program] validation error.', gl.getProgramInfLog(program));
    return null;
  }

  return program;
}

function main() {
  const canvas = document.getElementById('canvas');
  const gl = canvas.getContext('webgl');

  if (gl === null) {
    alert('Unable to initialize WebGL.');
    return;
  }

  let program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  if (program === null) return;

  const triangleVertices = [
    0, 0.5,         1.0, 0, 0,
    -0.5, -0.5,     0, 1.0, 0,
    0.5, -0.5,      0, 0, 1.0
  ];

  let bufferObj = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferObj);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);

  let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
  let colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
  let timeLocation = gl.getUniformLocation(program, 'time');
  gl.vertexAttribPointer(
    positionAttribLocation,     // attribute location
    2,                          // num elements per attribute
    gl.FLOAT,                   // type of elements
    gl.FALSE,                   // whether or not it is normalized
    5 * Float32Array.BYTES_PER_ELEMENT, // size of indiv vertex
    0                           // offset from beginning of a single vertex to this attrib
  );
  gl.vertexAttribPointer(
    colorAttribLocation,        // attribute location
    3,                          // num elements per attribute
    gl.FLOAT,                   // type of elements
    gl.FALSE,                   // whether or not it is normalized
    5 * Float32Array.BYTES_PER_ELEMENT, // size of indiv vertex
    2 * Float32Array.BYTES_PER_ELEMENT  // offset from beginning of a single vertex to this attrib
  );
  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);

  gl.useProgram(program);

  let time = 0;
  let loop = () => {
    gl.uniform1f(timeLocation, time);
    time += 0.01;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

window.onload = main;
