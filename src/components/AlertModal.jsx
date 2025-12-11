import React, { useEffect, useState } from "react";
import {
  HiX,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
} from "react-icons/hi";

/**
 * AlertModal Component
 *
 * A reusable modal component for displaying alerts, errors, success messages, and info messages.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback function to close the modal
 * @param {string} type - Alert type: 'success', 'error', 'warning', 'info'
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {number} autoClose - Auto close after milliseconds (0 = no auto close)
 * @param {React.ReactNode} children - Custom content to render
 * @param {string} primaryText - Primary button text
 * @param {function} onPrimary - Primary button click handler
 * @param {string} secondaryText - Secondary button text
 * @param {function} onSecondary - Secondary button click handler
 * @param {boolean} hideCloseButton - Hide the close button
 * @param {string} maxWidth - Maximum width of the modal (e.g., 'md', 'lg', 'xl', '2xl')
 * @param {boolean} closeOnBackdropClick - Allow closing modal by clicking backdrop
 * @param {boolean} showIcon - Show/hide the type icon
 */
export default function AlertModal({
  isOpen,
  onClose,
  type = "info",
  title = "",
  message = "",
  autoClose = 0,
  children,
  // Optional action customizations
  primaryText = "OK",
  onPrimary,
  secondaryText,
  onSecondary,
  hideCloseButton = true,
  maxWidth = "md",
  closeOnBackdropClick = true,
  showIcon = true,
}) {
  const [isClosing, setIsClosing] = useState(false);
  const ANIMATION_MS = 220;

  useEffect(() => {
    if (isOpen && autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, ANIMATION_MS);
  };

  if (!isOpen && !isClosing) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "white-bg",
          iconBg: "accent-bg-light",
          icon: <HiCheckCircle className="w-8 h-8 accent-text" />,
          titleColor: "black-text",
          messageColor: "gray-text-dark",
          closeColor: "gray-text hover:gray-text-dark",
          buttonBg: "btn-gradient-accent",
          buttonText: "white-text",
        };
      case "error":
        return {
          bg: "white-bg",
          iconBg: "danger-bg-light",
          icon: <HiExclamationCircle className="w-8 h-8 danger-text" />,
          titleColor: "black-text",
          messageColor: "gray-text-dark",
          closeColor: "gray-text hover:gray-text-dark",
          buttonBg: "btn-gradient-danger",
          buttonText: "white-text",
        };
      case "warning":
        return {
          bg: "white-bg",
          iconBg: "warning-bg-light",
          icon: <HiExclamationCircle className="w-8 h-8 warning-text" />,
          titleColor: "black-text",
          messageColor: "gray-text-dark",
          closeColor: "gray-text hover:gray-text-dark",
          buttonBg: "btn-gradient-warning",
          buttonText: "black-text",
        };
      default:
        return {
          bg: "white-bg",
          iconBg: "primary-bg-light",
          icon: <HiInformationCircle className="w-8 h-8 primary-text" />,
          titleColor: "black-text",
          messageColor: "gray-text-dark",
          closeColor: "gray-text hover:gray-text-dark",
          buttonBg: "btn-gradient-primary",
          buttonText: "white-text",
        };
    }
  };

  const styles = getTypeStyles();
  const defaultTitle =
    type === "error"
      ? "Error"
      : type === "success"
      ? "Success"
      : type === "warning"
      ? "Warning"
      : "Information";

  // Max width mapping
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/40 ${
          isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
        }`}
        onClick={handleBackdropClick}
      />

      <div
        className={`relative ${
          styles.bg
        } rounded-2xl ${maxWidthClasses[maxWidth] || maxWidthClasses.md} w-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] overflow-hidden border border-neutral-200 ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        {!hideCloseButton && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-150 flex-shrink-0 z-10"
            aria-label="Close"
          >
            <HiX className="w-5 h-5" />
          </button>
        )}

        <div className="px-6 md:px-8 py-6 md:py-8">
          {(title || message || showIcon) && (
            <div className={`${children ? "mb-6" : ""} ${showIcon ? "text-center" : ""}`}>
              {showIcon && (
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${styles.iconBg}`}>
                    {styles.icon}
                  </div>
                </div>
              )}
              {title && (
                <h3 className={`${styles.titleColor} font-semibold text-xl mb-2 ${showIcon ? "text-center" : ""}`}>
                  {title || defaultTitle}
                </h3>
              )}
              {message && (
                <p
                  className={`${styles.messageColor} ${title ? "mt-2" : ""} text-[15px] leading-relaxed ${
                    showIcon || title ? "text-center" : ""
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          )}

          {children ? (
            <div className={title || message ? "mt-6" : ""}>{children}</div>
          ) : (
            <div className="mt-8 flex justify-center items-center gap-3 flex-wrap">
              {secondaryText && (
                <button
                  onClick={onSecondary || handleClose}
                  className="btn btn-primary text-sm"
                >
                  {secondaryText}
                </button>
              )}
              <button
                onClick={onPrimary || handleClose}
                className={`btn ${type === "warning" && (primaryText?.toLowerCase().includes("delete") || primaryText?.toLowerCase().includes("logout")) ? "btn-danger" : "btn-primary"} text-sm`}
              >
                {primaryText}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes modal-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
        }
        @keyframes backdrop-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes backdrop-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .animate-modal-in {
          animation: modal-in ${ANIMATION_MS}ms ease-out forwards;
        }
        .animate-modal-out {
          animation: modal-out ${ANIMATION_MS}ms ease-in forwards;
        }
        .animate-backdrop-in {
          animation: backdrop-in ${ANIMATION_MS}ms ease-out forwards;
        }
        .animate-backdrop-out {
          animation: backdrop-out ${ANIMATION_MS}ms ease-in forwards;
        }
      `}</style>
    </div>
  );
}
