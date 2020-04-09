const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {


        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            });
        }
        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);


        client.broadcast.to(data.para).emit('listaPersonas', usuarios.getPersonasPorSala(data.sala));

        callback(usuarios.getPersonasPorSala(data.sala));
    });
    client.on('crearMensaje', (data) => {

        //envia el nombre del usuario sin necesidad de escribirlo
        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        //para mandarlo a las personas de la misma sala
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);

        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador'), `${personaBorrada.nombre} salió`)
        client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(personaBorrada.sala));


    });
    //mensaje privado

    client.on('mensajePrivado', data => {
        let persona = usuarios.getPersona(client.id);
        //to(data.para) estsablecemos el id para enviarlo solo a ese id
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });


});