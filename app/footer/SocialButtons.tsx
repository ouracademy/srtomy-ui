import Image from "next/image";
import Link from "next/link";
import React from "react";

interface SocialButtonsProps {
  links: { src: string; alt: string }[];
}

const WHATSAPP_NUMBER = "941475889";
const WHATSAPP_MESSAGE = "Hola estoy interesado en Oveja fiel";

const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const SocialButtons: React.FC<SocialButtonsProps> = ({ links }) => {
  return (
    <section className="social-section">
      <h2 className="section-title">SÍGUENOS EN</h2>
      <div className="social-buttons">
        {links.map((link, index) => (
          <Link href={whatsappURL} target="_blank" key={index}>
            <Image
              src={link.src}
              alt={link.alt}
              width={41}
              height={41}
              className="social-icon"
            />
          </Link>
        ))}
      </div>
      <style jsx>{`
        .social-section {
          flex: 1;
        }
        .section-title {
          margin-top: 20px;
          color: #fff;
          font-size: 1em;
          font-weight: bold;
          font-family: Helvetica;
        }
        .social-buttons {
          display: flex;
          flex-direction: row;
          margin-top: 20px;
        }
        .social-icon {
          width: 41px;
          height: 41px;
          margin-right: 10px;
          object-fit: contain;
        }
      `}</style>
    </section>
  );
};

export default SocialButtons;
